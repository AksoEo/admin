import { h } from 'preact';
import { PureComponent } from 'preact/compat';
import OverviewList from '../../../../../components/overview-list';
import { paymentAddons as locale } from '../../../../../locale';
import { FIELDS } from './fields';

export default class AddonsTab extends PureComponent {
    state = {
        parameters: {
            fields: [
                { id: 'name', sorting: 'none', fixed: true },
                { id: 'description', sorting: 'none', fixed: true },
            ],
            offset: 0,
            limit: 10,
        },
    };

    render ({ org }, { parameters }) {
        return (
            <div class="payment-addons-tab">
                <OverviewList
                    task="payments/listAddons"
                    view="payments/addon"
                    updateView={['payments/sigAddons', { org }]}
                    options={{ org }}
                    viewOptions={{ org }}
                    parameters={parameters}
                    fields={FIELDS}
                    onGetItemLink={id => `/pagoj/organizoj/${org}/[[addons]]/${id}`}
                    onSetOffset={offset => this.setState({ parameters: { ...parameters, offset }})}
                    onSetLimit={limit => this.setState({ parameters: { ...parameters, limit }})}
                    locale={locale.fields} />
            </div>
        );
    }
}
