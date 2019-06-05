import { restRequest } from '@girder/core/rest';
import View from '@girder/core/views/View';
import BrowserWidget from '@girder/core/views/widgets/BrowserWidget';
import $ from 'jquery';
import tarExport from './tarExport.pug';
import '@girder/core/utilities/jquery/girderEnable';

const TarExportView = View.extend({
    events: {
      'submit .g-tar-export-form': function (e) {
          e.preventDefault();
          this.$('.g-submit-tar-export').girderEnable(false);
          restRequest({
              type: 'POST',
              url: `assetstore/${this.model.id}/tar_export`,
              data: {
                  path: this.$('#g-tar-export-path').val(),
                  folderId: this.$('#g-tar-export-folder-id').val(),
                  compression: this.$('#g-tar-export-compression').val(),
                  progress: true
              }
          }).done(() => {

          }).always(() => {
            this.$('.g-submit-tar-export').girderEnable(true);
          });
      },
      'click .g-open-browser': function () {
          this._browserWidgetView.setElement($('#g-dialog-container')).render();
      },
    },
    initialize() {
        this._browserWidgetView = new BrowserWidget({
            parentView: this,
            titleText: 'Archive a folder',
            helpText: 'Browse to a folder.',
            submitText: 'Choose folder',
            validate: function (model) {
                let isValid = $.Deferred();
                if (!model) {
                    isValid.reject('Please select a valid root.');
                } else if (model.resourceName !== 'folder') {
                    isValid.reject('You must select a folder.');
                } else {
                    isValid.resolve();
                }
                return isValid.promise();
            }
        });
        this.listenTo(this._browserWidgetView, 'g:saved', function (val) {
            this.$('#g-tar-export-folder-id').val(val.id);
        });
    },
    render() {
        this.$el.html(tarExport({
            assetstore: this.model
        }));
    }
});

export default TarExportView;
