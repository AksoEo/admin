import { h } from 'preact';
import EditIcon from '@material-ui/icons/Edit';
import Page from '../../../components/page';
import DetailView from '../../../components/detail';
import Meta from '../../meta';
import { codeholders as locale, detail as detailLocale } from '../../../locale';
import { coreContext } from '../../../core/connection';
import { Header, fields, Footer } from './detail-fields';

export default class Detail extends Page {
    static contextType = coreContext;

    state = {
        edit: null,
    };

    onEndEdit = () => {
        this.props.editing && this.props.editing.pop(true);
        this.setState({ edit: null });
    };

    #commitTask;

    onCommit = changedFields => {
        if (!this.props.editing || this.#commitTask) return;
        if (!changedFields.length) {
            // nothing changed, so we can just pop the editing state
            this.props.editing.pop(true);
            return;
        }

        this.#commitTask = this.context.createTask('codeholders/update', {
            id: +this.props.match[1],
            _changedFields: changedFields,
        }, this.state.edit);
        this.#commitTask.on('success', this.onEndEdit);
        this.#commitTask.on('drop', () => this.#commitTask = null);
    };

    componentWillUnmount () {
        if (this.#commitTask) this.#commitTask.drop();
    }

    render ({ editing }) {
        const { match } = this.props;
        const id = match[1];

        const actions = [];
        if (!editing) {
            actions.push({
                label: detailLocale.edit,
                icon: <EditIcon style={{ verticalAlign: 'middle' }} />,
                action: () => this.props.onNavigate(`/membroj/${id}/redakti`, true),
            });
            actions.push({
                label: locale.logins.title,
                action: () => this.props.onNavigate(`/membroj/${id}/[[logins]]`),
                overflow: true,
            });
            actions.push({
                label: locale.delete,
                action: () => this.context.createTask('codeholders/delete', { id }),
                overflow: true,
            });
        }

        return (
            <div class="codeholder-detail-page">
                <Meta
                    title={locale.detailTitle}
                    actions={actions} />
                <DetailView
                    view="codeholders/codeholder"
                    id={id}
                    editing={editing}
                    onEndEdit={this.onEndEdit}
                    onCommit={this.onCommit}
                    edit={this.state.edit}
                    onEditChange={edit => this.setState({ edit })}
                    onDelete={() => this.props.pop()}
                    makeHistoryLink={field => `/membroj/${id}/historio?${field}`}
                    options={{
                        fields: [
                            'id',
                            'type',
                            'name',
                            'careOf',
                            'website',
                            'biography',
                            'code',
                            'creationTime',
                            'hasPassword',
                            'address',
                            'feeCountry',
                            'membership',
                            'email',
                            'enabled',
                            'notes',
                            'officePhone',
                            'landlinePhone',
                            'cellphone',
                            'isDead',
                            'birthdate',
                            'age',
                            'deathdate',
                            'profilePictureHash',
                            'isActiveMember',
                            'profession',
                            'addressPublicity',
                            'emailPublicity',
                            'officePhonePublicity',
                            'profilePicturePublicity',
                            'lastNamePublicity',
                            'landlinePhonePublicity',
                            'cellphonePublicity',
                        ],
                    }}
                    header={Header}
                    fields={fields}
                    footer={Footer}
                    locale={locale} />
            </div>
        );
    }
}
