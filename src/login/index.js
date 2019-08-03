import { h, Component } from 'preact';
import PropTypes from 'prop-types';
import UEACode from 'akso-client/uea-code';
import Form, { Validator } from '../components/form';
import LogoTransition from './logo-transition';
import { Button, Checkbox, TextField, CircularProgress } from 'yamdl';
import locale from '../locale';
import ProgressIndicator from './progress-indicator';
import AutosizingPageView from './autosizing-page-view';
import { Spring } from '../animation';
import client from '../client';
import { getPageMode, Mode } from './is-special-page';
import './style';

const Stage = {
    LOST_SECURITY_CODE: -3,
    FORGOT_CODE: -2,
    FORGOT_PASSWORD: -1,
    DETAILS: 0,
    SECURITY_CODE: 1,
};

const MIN_INDEX = -3;

const temporaryBackLinkStyle = {
    display: 'block',
    textAlign: 'center',
    fontSize: '1.2em',
    color: 'inherit',
};

/** The login screen. */
export default class Login extends Component {
    static propTypes = {
        /** Login callback. */
        onLogin: PropTypes.func.isRequired,

        /** End callback—signals that the component should be unmounted. */
        onEnd: PropTypes.func,
    };

    state = {
        username: '',
        stage: Stage.DETAILS,
        loading: false,
        mode: Mode.NORMAL,
        loggedIn: false,
    };

    pageView = null;
    detailsStage = null;
    securityCodeStage = null;

    /** Called when the current dialog page changes. */
    onPageChange = page => {
        if (page === Stage.DETAILS) {
            this.detailsStage.focus();
        } else if (page === Stage.SECURITY_CODE) {
            this.securityCodeStage.focus();
        }
    };

    componentDidMount () {
        document.title = locale.documentTitleTemplate(locale.login.title);

        if (client.loggedIn && client.totpRequired) {
            // setTimeout to fix weird glitchiness
            setTimeout(() => {
                this.setState({ stage: Stage.SECURITY_CODE });
            }, 100);
        }

        this.setState(getPageMode(), () => this.pageView.pageHeightChanged());

        setTimeout(() => {
            // fake page change to trigger focus
            this.onPageChange(this.state.stage);
        }, 100);
    }

    onLogin = () => {
        let logoRect;
        if (getComputedStyle(this.logoNode).opacity) {
            logoRect = this.logoNode.getBoundingClientRect();
        } else {
            logoRect = this.smallLogoNode.getBoundingClientRect();
        }
        this.setState({ loggedIn: true });

        setTimeout(() => this.props.onEnd(), 300);

        this.props.onLogin({ component: LogoTransition, props: { initialRect: logoRect } });
    };

    render () {
        const meta = (
            <div class="login-meta">
                {locale.meta.copyright} <a
                    href={locale.meta.copyrightHref}
                    target="_blank"
                    rel="noopener noreferrer">
                    {locale.meta.copyrightHolder}
                </a>, {locale.meta.license} · <a
                    href={locale.meta.githubHref}
                    target="_blank"
                    rel="noopener noreferrer">
                    {locale.meta.github}
                </a>
            </div>
        );

        return (
            <div class={'login' + (this.state.loggedIn ? ' logged-in' : '')}>
                <div class="login-dialog">
                    <header class="login-header">
                        <img
                            class="login-logo"
                            ref={node => this.logoNode = node}
                            src="/assets/logo-dark.svg"
                            aria-hidden="true"
                            role="presentation"
                            draggable={0} />
                        <div class="login-label">
                            <img
                                class="login-small-logo"
                                ref={node => this.smallLogoNode = node}
                                src="/assets/logo-dark.svg"
                                aria-hidden="true"
                                role="presentation"
                                draggable={0} />
                            <img
                                class="login-logo-label"
                                src="/assets/logo-label-dark.svg"
                                alt="AKSO"
                                draggable={0} />
                        </div>
                        <ProgressIndicator
                            selected={this.state.stage < 0 ? -2 : this.state.stage}
                            helpLabel={
                                this.state.stage === Stage.FORGOT_PASSWORD
                                    ? locale.login.forgotPassword
                                    : this.state.stage === Stage.FORGOT_CODE
                                        ? locale.login.forgotCode
                                        : this.state.stage === Stage.LOST_SECURITY_CODE
                                            ? locale.login.lostSecurityCode
                                            : ''
                            }>
                            <span onClick={() => {
                                if (client.loggedIn) {
                                    client.logOut().then(() => {
                                        this.setState({ stage: Stage.DETAILS });
                                    });
                                }
                            }}>
                                {this.state.mode === Mode.NORMAL
                                    ? locale.login.detailsStage
                                    : this.state.mode === Mode.CREATING_PASSWORD
                                        ? locale.login.createPasswordStage
                                        : locale.login.resetPasswordStage}
                            </span>
                            <span>{locale.login.securityCodeStage}</span>
                        </ProgressIndicator>
                    </header>
                    <AutosizingPageView
                        ref={view => this.pageView = view}
                        selected={this.state.stage}
                        minIndex={MIN_INDEX}
                        onPageChange={this.onPageChange}>
                        <p>
                            (...)<br />
                            <a
                                style={temporaryBackLinkStyle}
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    this.setState({ stage: Stage.SECURITY_CODE });
                                }}>
                                Reiri
                            </a>
                        </p>
                        <p>
                           (...)<br />
                            <a
                                style={temporaryBackLinkStyle}
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    this.setState({ stage: Stage.DETAILS });
                                }}>
                                Reiri
                            </a>
                        </p>
                        <p>
                            (...)<br />
                            <a
                                style={temporaryBackLinkStyle}
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    this.setState({ stage: Stage.DETAILS });
                                }}>
                                Reiri
                            </a>
                        </p>
                        <DetailsStage
                            ref={stage => this.detailsStage = stage}
                            username={this.state.username}
                            mode={this.state.mode}
                            onUsernameChange={username => this.setState({ username })}
                            onSuccess={(totpSetUp, totpUsed) => {
                                if (!totpSetUp) {
                                    // TODO: this
                                    throw new Error('unimplemented');
                                } else if (!totpUsed) {
                                    this.setState({ stage: Stage.SECURITY_CODE });
                                } else this.onLogin();
                            }}
                            onForgotPassword={() => this.setState({ stage: Stage.FORGOT_PASSWORD })}
                            onForgotCode={() => this.setState({ stage: Stage.FORGOT_CODE })} />
                        <SecurityCodeStage
                            ref={stage => this.securityCodeStage = stage}
                            onSuccess={this.onLogin}
                            onShouldLoginFirst={() => this.setState({ stage: Stage.DETAILS })}
                            onLostCode={() => this.setState({ stage: Stage.LOST_SECURITY_CODE })}
                            onHeightChange={() => this.pageView.pageHeightChanged()} />
                    </AutosizingPageView>
                    {meta}
                </div>
                {meta}
            </div>
        );
    }
}

class DetailsStage extends Component {
    propTypes = {
        onSuccess: PropTypes.func.isRequired,
        onForgotPassword: PropTypes.func.isRequired,
        onForgotCode: PropTypes.func.isRequired,
        username: PropTypes.string.isRequired,
        onUsernameChange: PropTypes.func.isRequired,
        mode: PropTypes.number.isRequired,
    };

    state = {
        password: '',
        confirmPassword: '',
        loading: false,
    };

    usernameField = null;
    passwordField = null;
    passwordValidator = null;

    focus () {
        if (this.props.mode === Mode.NORMAL) {
            this.usernameField.focus();
        } else {
            this.passwordField.focus();
        }
    }

    render () {
        return (
            <Form onSubmit={() => {
                if (this.state.loading) return;
                this.setState({ loading: true });

                if (this.props.mode === Mode.NORMAL) {
                    let username = this.props.username;
                    try {
                        // remove check letters in old UEA codes
                        username = new UEACode(username).code;
                    } catch (_) { /* not a UEA code */ }

                    client.logIn(username, this.state.password).then(response => {
                        if (response.isAdmin) {
                            this.setState({
                                loading: false,
                                password: '',
                                confirmPassword: '',
                            });
                            this.props.onSuccess(response.totpSetUp, response.totpUsed);
                        } else throw { statusCode: 'not-admin' };
                    }).catch(err => {
                        let error = locale.login.genericError;
                        if (err.statusCode === 401) {
                            if (this.props.username.includes('@')) {
                                error = locale.login.invalidLogin.email;
                            } else {
                                error = locale.login.invalidLogin.ueaCode;
                            }
                        } else if (err.statusCode === 409) error = locale.login.noPassword;

                        if (err.statusCode === 'not-admin') {
                            error = locale.login.notAdmin;

                            client.logOut().then(() => {
                                this.passwordValidator.shake();
                                this.passwordValidator.setError({ error });
                                this.setState({ loading: false });
                            });
                        } else {
                            this.passwordValidator.shake();
                            this.passwordValidator.setError({ error });
                            this.setState({ loading: false });
                        }
                    });
                } else {
                    // TODO: this
                    throw new Error('unimplemented');
                }
            }}>
                <Validator component={TextField}
                    class="form-field"
                    innerRef={node => this.usernameField = node}
                    outline
                    label={locale.login.username}
                    type={this.props.username.includes('@') ? 'email' : 'text'}
                    autocapitalize="none"
                    value={this.props.username}
                    onChange={e => this.props.onUsernameChange(e.target.value)}
                    validate={value => {
                        if (!value.includes('@') && !UEACode.validate(value)) {
                            throw { error: locale.login.invalidUEACode };
                        }
                    }} />
                <Validator component={TextField}
                    class="form-field"
                    ref={node => this.passwordValidator = node}
                    innerRef={node => this.passwordField = node}
                    outline
                    label={locale.login.password}
                    value={this.state.password}
                    type="password"
                    placeholder={this.props.mode === Mode.CREATING_PASSWORD
                        ? locale.login.createPasswordPlaceholder
                        : null}
                    onChange={e => this.setState({ password: e.target.value })}
                    validate={() => true} />
                {this.props.mode !== Mode.NORMAL ? (
                    <Validator component={TextField}
                        class="form-field"
                        outline
                        label={locale.login.confirmPassword}
                        value={this.state.confirmPassword}
                        type="password"
                        placeholder={locale.login.confirmPasswordPlaceholder}
                        onChange={e => this.setState({ confirmPassword: e.target.value })}
                        validate={value => {
                            if (value !== this.state.password) {
                                throw { error: locale.login.passwordMismatch };
                            }
                        }} />
                ) : null}
                <footer class="form-footer">
                    {this.props.mode === Mode.NORMAL ? (
                        <div class="help-links">
                            <a
                                class="help-link"
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    this.props.onForgotPassword();
                                }}>
                                {locale.login.forgotPassword}
                            </a>
                            <br />
                            <a
                                class="help-link"
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    this.props.onForgotCode();
                                }}>
                                {locale.login.forgotCode}
                            </a>
                        </div>
                    ) : <div class="help-links" />}
                    <Button type="submit" class="raised" disabled={this.state.loading}>
                        {this.state.loading ? (
                            <CircularProgress
                                class="progress-overlay"
                                indeterminate
                                small />
                        ) : null}
                        <span>{locale.login.continue}</span>
                    </Button>
                </footer>
            </Form>
        );
    }
}

// TODO: mode for creating a TOTP code or something
class SecurityCodeStage extends Component {
    propTypes = {
        onSuccess: PropTypes.func.isRequired,
        onShouldLoginFirst: PropTypes.func.isRequired,
        onLostCode: PropTypes.func.isRequired,
        onHeightChange: PropTypes.func.isRequired,
    };

    state = {
        securityCode: '',
        bypassTotp: false,
        loading: false,
    }

    form = null;
    securityCodeField = null;
    securityCodeValidator = null;

    focus () {
        this.securityCodeField.focus();
    }

    render () {
        return (
            <Form ref={node => this.form = node} onSubmit={() => {
                this.setState({ loading: true });
                client.totpLogIn(this.state.securityCode, this.state.bypassTotp).then(() => {
                    this.setState({ loading: false });
                    this.props.onSuccess();
                }).catch(err => {
                    this.securityCodeValidator.shake();
                    let error = locale.login.genericTotpError;
                    if (err.statusCode === 401) error = locale.login.invalidTotp;
                    else if (err.statusCode === 403) {
                        // already logged in
                        this.props.onSuccess();
                    } else if (err.statusCode === 404) {
                        // no session found
                        this.props.onShouldLoginFirst();
                    }
                    this.securityCodeValidator.setError({ error });
                    this.setState({ loading: false });
                });
            }}>
                <p>
                    {locale.login.securityCodeDescription}
                </p>
                <Validator component={TextField}
                    class="form-field totp-input"
                    ref={node => this.securityCodeValidator = node}
                    innerRef={node => this.securityCodeField = node}
                    outline
                    center
                    label={locale.login.securityCode}
                    value={this.state.securityCode}
                    placeholder="000000"
                    // \d* seems to be the only way to get a numpad input on iOS
                    pattern="\d*"
                    type="number"
                    onKeyDown={e => {
                        if (!e.key.match(/\d/) && !e.key.match(/^[A-Z]/)) {
                            e.preventDefault();
                        }
                    }}
                    onKeyUp={() => requestAnimationFrame(() => {
                        if (this.state.securityCode.length === 6) {
                            this.form.submit();
                        }
                    })}
                    onChange={e => this.setState({
                        securityCode: e.target.value.replace(/\D/g, '').substr(0, 6),
                    })}
                    validate={value => {
                        if (!value || !value.match(/^\d{6}$/)) {
                            throw { error: locale.login.invalidSecurityCode };
                        }
                    }} />
                <TotpBypassSwitch
                    value={this.state.bypassTotp}
                    onChange={bypassTotp => this.setState({ bypassTotp })}
                    onHeightChange={this.props.onHeightChange} />
                <footer class="form-footer">
                    <div class="help-links">
                        <a
                            class="help-link"
                            href="#"
                            onClick={e => {
                                e.preventDefault();
                                this.props.onLostCode();
                            }}>
                            {locale.login.lostSecurityCode}
                        </a>
                    </div>
                    <Button type="submit" class="raised" disabled={this.state.loading}>
                        {this.state.loading ? (
                            <CircularProgress
                                class="progress-overlay"
                                indeterminate
                                small />
                        ) : null}
                        <span>{locale.login.login}</span>
                    </Button>
                </footer>
            </Form>
        );
    }
}

class TotpBypassSwitch extends Component {
    static propTypes = {
        value: PropTypes.bool,
        onChange: PropTypes.func.isRequired,
        onHeightChange: PropTypes.func.isRequired,
    };

    heightSpring = new Spring(1, 0.3);

    state = {
        height: 0,
    };

    constructor (props) {
        super(props);
        this.heightSpring.on('update', height => {
            this.setState({ height });
            this.props.onHeightChange();
        });
    }

    componentDidMount () {
        this.updateHeight();
        this.heightSpring.finish();
    }

    updateHeight () {
        const height = this.node.style.height;
        this.node.style.height = '';
        this.heightSpring.target = this.node.offsetHeight;
        this.node.style.height = height;
        this.heightSpring.start();
    }

    componentWillUnmount () {
        this.heightSpring.stop();
    }

    render ({ value, onChange }, { height }) {
        return (
            <p
                class="totp-bypass-container"
                ref={node => this.node = node}
                style={{ height }}>
                <Checkbox
                    class="totp-bypass-switch"
                    id="totp-bypass-switch"
                    checked={value}
                    onChange={value => {
                        onChange(value);
                        requestAnimationFrame(() => this.updateHeight());
                    }} />
                <label
                    class="totp-bypass-label"
                    for="totp-bypass-switch">
                    {locale.login.bypassTotp}
                </label>
                <p class={'totp-bypass-description' + (value ? '' : ' hidden')}>
                    {locale.login.bypassTotpDescription}
                </p>
            </p>
        );
    }
}
