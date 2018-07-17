import os
import tarfile

from girder.api import access
from girder.api.describe import autoDescribeRoute, Description
from girder.api.rest import boundHandler, setResponseHeader
from girder.api.v1.assetstore import Assetstore
from girder.constants import AccessType, AssetstoreType, TokenScope
from girder.exceptions import AccessException
from girder.models.assetstore import Assetstore as AssetstoreModel
from girder.models.file import File
from girder.models.folder import Folder
from girder.models.item import Item
from girder.utility.assetstore_utilities import getAssetstoreAdapter, setAssetstoreAdapter
from girder.utility.filesystem_assetstore_adapter import FilesystemAssetstoreAdapter, BUF_SIZE
from girder.utility.progress import ProgressContext


class TarSupportAdapter(FilesystemAssetstoreAdapter):
    def downloadFile(self, file, offset=0, headers=True, endByte=None, contentDisposition=None,
                     **kwargs):
        if file.get('pathInTarfile'):
            return self._downloadFromTar(file, offset, endByte, headers, contentDisposition)

        return super(TarSupportAdapter, self).downloadFile(
            file, offset, headers, endByte, contentDisposition, **kwargs)

    def _downloadFromTar(self, file, offset, endByte, headers, contentDisposition):
        if endByte is None or endByte > file['size']:
            endByte = file['size']

        if headers:
            setResponseHeader('Accept-Ranges', 'bytes')
            self.setContentHeaders(file, offset, endByte, contentDisposition)

        def stream():
            with tarfile.open(file['tarPath'], 'r') as tar:
                fh = tar.extractfile(file['pathInTarfile'])
                bytesRead = offset

                if offset > 0:
                    fh.seek(offset)

                while True:
                    readLen = min(BUF_SIZE, endByte - bytesRead)
                    if readLen <= 0:
                        break

                    data = fh.read(readLen)
                    bytesRead += readLen

                    if not data:
                        break
                    yield data
                fh.close()

        return stream

    def _importTar(self, path, folder, progress, user):
        folderCache = {}

        def _resolveFolder(name):
            if name in {'.', ''}:  # This file is at the top level
                return folder
            if name not in folderCache:
                tokens = name.split('/')
                sub = folder
                for token in tokens:
                    if token == '.':
                        continue
                    sub = Folder().createFolder(sub, token, creator=user, reuseExisting=True)
                folderCache[name] = sub

            return folderCache[name]

        with tarfile.open(path, 'r') as tar:
            for entry in tar:
                if entry.isreg():
                    dir, name = os.path.split(entry.name)
                    progress.update(message=entry.name)
                    parent = _resolveFolder(dir)
                    if not Folder().hasAccess(parent, user, AccessType.WRITE):
                        raise AccessException('Write access denied for folder: %s' % folder['_id'])
                    item = Item().createItem(
                        name=name, creator=user, folder=parent, reuseExisting=True)
                    file = File().createFile(
                        name=name, creator=user, item=item, reuseExisting=True,
                        assetstore=self.assetstore,
                        size=entry.size, saveFile=False)
                    file['path'] = ''
                    file['tarPath'] = path
                    file['imported'] = True
                    file['pathInTarfile'] = entry.name
                    File().save(file)

@boundHandler
def _exportTar(self):
    pass


@boundHandler
@access.admin(scope=TokenScope.DATA_WRITE)
@autoDescribeRoute(
    Description('Import a tape archive (tar) file into the system.')
    .notes('This does not move or copy the existing data, it just creates '
           'references to it in the Girder data hierarchy. Deleting '
           'those references will not delete the underlying data.')
    .modelParam('id', model=AssetstoreModel)
    .modelParam('folderId', 'Import destination folder.', model=Folder, level=AccessType.WRITE)
    .param('importPath', 'Root path within the underlying storage system '
           'to import.', required=False)
    .param('progress', 'Whether to record progress on the import.',
           dataType='boolean', default=False, required=False)
    .errorResponse()
    .errorResponse('You are not an administrator.', 403))
def _importTar(self, assetstore, folder, importPath, progress):
    user = self.getCurrentUser()
    adapter = getAssetstoreAdapter(assetstore)

    with ProgressContext(progress, user=user, title='Importing data') as ctx:
        return adapter._importTar(importPath, folder, ctx, user)


def load(info):
    setAssetstoreAdapter(AssetstoreType.FILESYSTEM, TarSupportAdapter)

    Assetstore.route('POST', (':id', 'tar_export'), _exportTar)
    Assetstore.route('POST', (':id', 'tar_import'), _importTar)
