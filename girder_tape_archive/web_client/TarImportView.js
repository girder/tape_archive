import { restRequest } from '@girder/core/rest';
import router from '@girder/core/router';
import View from '@girder/core/views/View';
import '@girder/core/utilities/jquery/girderEnable';
import tarImport from './tarImport.pug';

const TarImportView = View.extend({
    events: {
      'submit .g-tar-import-form': function (e) {
          e.preventDefault();
          this.$('.g-validation-failed-message').empty();
          this.$('.g-submit-tar-import').girderEnable(false);
          restRequest({
              type: 'POST',
              url: `folder/${this.model.id}/tar_import`,
              data: {
                  path: this.$('#g-tar-import-path').val(),
                  progress: true
              },
              error: null
          }).done(() => {
              router.navigate(`folder/${this.model.id}`, { trigger: true });
          }).fail((resp) => {
            if (resp && resp.responseJSON) {
              this.$('.g-validation-failed-message').text(resp.responseJSON.message);
            } else {
              this.$('.g-validation-failed-message').text('Did not receive response from server.')
            }
          }).always(() => {
            this.$('.g-submit-tar-import').girderEnable(true);
          });
      },
    },
    render() {
        this.$el.html(tarImport({
            folder: this.model
        }));
    }
});

export default TarImportView;
