import { h } from 'preact';
import AddIcon from '@material-ui/icons/Add';
import Page from '../../../../components/page';
import OverviewList from '../../../../components/overview-list';
import Meta from '../../../meta';
import { coreContext } from '../../../../core/connection';
import { connectPerms } from '../../../../perms';
import { paymentOrgs as locale } from '../../../../locale';
import { FIELDS } from './fields';

export default connectPerms(class Orgs extends Page {
    state = {
        parameters: {
            fields: [
                { id: 'org', sorting: 'none', fixed: true },
                { id: 'name', sorting: 'none', fixed: true },
                { id: 'description', sorting: 'none', fixed: true },
            ],
            offset: 0,
            limit: 10,
        },
    };

    static contextType = coreContext;

    render ({ perms }, { parameters }) {
        const actions = [];

        if (perms.hasPerm('pay.payment_orgs.create.tejo')
            || perms.hasPerm('pay.payment_orgs.create.uea')) {
            actions.push({
                icon: <AddIcon />,
                label: locale.create.menuItem,
                action: () => this.context.createTask('payments/createOrg'),
            });
        }

        return (
            <div class="payment-orgs-page">
                <Meta
                    title={locale.title}
                    actions={actions} />
                <OverviewList
                    task="payments/listOrgs"
                    view="payments/org"
                    parameters={parameters}
                    fields={FIELDS}
                    onGetItemLink={id => `/aksopago/organizoj/${id}`}
                    onSetOffset={offset => this.setState({ parameters: { ...parameters, offset }})}
                    onSetLimit={limit => this.setState({ parameters: { ...parameters, limit }})}
                    locale={locale.fields}
                    updateView={['payments/sigOrgs']} />
            </div>
        );
    }
});
