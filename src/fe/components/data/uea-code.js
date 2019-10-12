import { h, Component } from 'preact';
import { CircularProgress } from '@cpsdqs/yamdl';
import { UEACode as AKSOUEACode } from '@tejo/akso-client';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import { coreContext } from '../../core/connection';
import locale from '../../locale';
import { Validator } from '../form';
import SuggestionField from '../suggestion-field';

/// Renders a single UEA code. Props: `value`, `old`.
export function UEACode ({ value, old, ...extra }) {
    if (!value) return null;
    if (old) {
        const oldCodeCheckLetter = new AKSOUEACode(value).getCheckLetter();
        return <span class="data uea-code is-old" {...extra}>{value}-{oldCodeCheckLetter}</span>;
    } else {
        return <span class="data uea-code" {...extra}>{value}</span>;
    }
}

function BothUEACodes ({ value, value2 }) {
    if (!value2) return <UEACode value={value} />;
    return (
        <span class="data both-uea-codes">
            <UEACode value={value} />
            {!!value2 && ' '}
            <UEACode value={value2} old />
        </span>
    );
}

/// Also pass `id` to enable checking if it’s taken.
/// Also pass an array to `suggestions` to show a list of suggestions.
class UEACodeEditor extends Component {
    state = {
        takenState: null,
    };

    static contextType = coreContext;

    checkTaken () {
        let isNewCode = false;
        try {
            isNewCode = new AKSOUEACode(this.props.value).type === 'new';
        } catch (_) {
            //
        }
        if (!this.props.id || !isNewCode) {
            this.setState({ takenState: null });
            return;
        }
        this.setState({ takenState: 'loading' });
        return this.context.createTask('codeholders/list', {
            jsonFilter: { newCode: this.props.value, id: { $neq: this.props.id } },
            offset: 0,
            limit: 1,
        }).runOnceAndDrop().then(({ items }) => {
            if (this.doNotUpdate) return;
            if (items.length) this.setState({ takenState: 'taken' });
            else this.setState({ takenState: 'available' });
        }).catch(err => {
            if (this.doNotUpdate) return;
            console.error(err); // eslint-disable-line no-console
            this.setState({ takenState: null });
        });
    }

    componentDidUpdate (prevProps) {
        if (prevProps.value !== this.props.value) this.checkTaken();
    }

    componentWillUnmount () {
        this.doNotUpdate = true;
    }

    render ({ value, onChange, suggestions, ...extraProps }) {
        let trailing;
        if (this.state.takenState === 'loading') {
            trailing = <CircularProgress class="taken-state is-loading" small indeterminate />;
        } else if (this.state.takenState === 'available') {
            trailing = <CheckIcon class="taken-state is-available" />;
        } else if (this.state.takenState === 'taken') {
            trailing = <CloseIcon class="taken-state is-taken" />;
        }

        const className = 'data uea-code-editor' + (extraProps.class ? ' ' + extraProps.class : '');
        delete extraProps.class;

        return <Validator
            class={className}
            component={SuggestionField}
            value={value}
            suggestions={suggestions || []}
            onChange={onChange}
            maxLength={6}
            placeholder="xxxxxx"
            label={locale.data.ueaCode.newCode}
            validate={() => {
                try {
                    const code = new AKSOUEACode(value);
                    if (code.type !== 'new') throw 0;
                } catch (_) {
                    throw { error: locale.data.ueaCode.invalidUEACode };
                }
                if (this.state.takenState === 'taken') {
                    throw { error: locale.data.ueaCode.codeTaken };
                }
            }}
            trailing={trailing}
            {...extraProps} />;
    }
}

export default {
    renderer: BothUEACodes,
    inlineRenderer: BothUEACodes,
    editor: UEACodeEditor,
};
