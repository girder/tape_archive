import events from 'girder/events';
import { restRequest } from 'girder/rest';
import { wrap } from 'girder/utilities/PluginUtils';
import AssetstoresView from 'girder/views/body/AssetstoresView';
import FilesystemImportView from 'girder/views/body/FilesystemImportView';
import exportButton from './exportButton.pug';
import importTemplate from './import.pug';
import './import.styl';
import 'girder/utilities/jquery/girderEnable';

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
            folderId: this.$('#g-filesystem-import-dest-id').val(),
            path: this.$('#g-filesystem-import-path').val(),
            progress: true
        },
        error: null,
    }).done(() => {
        events.trigger('g:alert', {
            icon: 'ok',
            type: 'success',
            message: 'Import complete.',
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
