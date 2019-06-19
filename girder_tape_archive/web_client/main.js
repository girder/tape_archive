import { AccessType } from '@girder/core/constants';
import events from '@girder/core/events';
import router from '@girder/core/router';
import { restRequest } from '@girder/core/rest';
import { wrap } from '@girder/core/utilities/PluginUtils';
import AssetstoresView from '@girder/core/views/body/AssetstoresView';
import HierarchyWidget from '@girder/core/views/widgets/HierarchyWidget';
import AssetstoreModel from '@girder/core/models/AssetstoreModel';
import FolderModel from '@girder/core/models/FolderModel';
import FilesystemImportView from '@girder/core/views/body/FilesystemImportView';
import $ from 'jquery';
import exportButton from './exportButton.pug';
import importMenuTemplate from './importMenu.pug';
import importTemplate from './import.pug';
import TarExportView from './TarExportView';
import TarImportView from './TarImportView';
import './import.styl';
import '@girder/core/utilities/jquery/girderEnable';

wrap(HierarchyWidget, 'render', function (render) {
    render.call(this);

    if (this.parentModel.resourceName === 'folder' &&
            this.parentModel.getAccessLevel() >= AccessType.WRITE) {
        this.$('.g-folder-actions-menu a.g-edit-folder').parent().after(importMenuTemplate({
            folder: this.parentModel
        }));
    }
    return this;
});

wrap(FilesystemImportView, 'render', function (render) {
    render.call(this);
    this.$('.g-submit-assetstore-import').after(importTemplate());
    return this;
});

FilesystemImportView.prototype.events['click .g-tape-archive-import'] = function (e) {
    e.preventDefault();

    $(e.target).girderEnable(false);
    restRequest({
        type: 'POST',
        url: `assetstore/${this.assetstore.id}/tar_import`,
        data: {
            folderId: this.$('#g-filesystem-import-dest-id').val().split(' ')[0],
            path: this.$('#g-filesystem-import-path').val(),
            progress: true
        },
        error: null,
    }).done(() => {
        events.trigger('g:alert', {
            icon: 'ok',
            type: 'success',
            text: 'Import complete.',
            timeout: 4000,
        });
    }).error((resp) => {
        events.trigger('g:alert', {
            icon: 'cancel',
            text: resp.responseJSON.message,
            type: 'danger',
            timeout: 4000
        });
    }).always(() => {
        $(e.target).girderEnable(true);
    })
};

wrap(AssetstoresView, 'render', function (render) {
   render.call(this);
   this.$('.g-assetstore-container').each((k, el) => {
       if ($(el).find('.g-assetstore-info-section[assetstore-type=0]').length === 0) {
           return;  // skip non-filesystem assetstore
       }
       const cid = $(el).find('.g-assetstore-info-section').attr('cid');
       $(el).find('.g-assetstore-buttons').append(exportButton({
           assetstoreId: this.collection.get(cid).id
       }));
   });
   return this;
});

router.route('assetstore/:id/tar_export', 'tarExport', function (id) {
    const model = new AssetstoreModel({
        _id: id
    });
    model.fetch().then(() => {
        events.trigger('g:navigateTo', TarExportView, {
            model
        }, {
            renderNow: true
        });
    });
});

router.route('import_tar/:id', 'tarImport', function (id) {
    const model = new FolderModel({
        _id: id
    });
    model.fetch().then(() => {
        events.trigger('g:navigateTo', TarImportView, {
            model
        }, {
            renderNow: true
        })
    });
});
