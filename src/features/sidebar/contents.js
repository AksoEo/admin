import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import SearchIcon from '@material-ui/icons/Search';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Link, ROUTES } from '../../router';
import locale from '../../locale';
import { TEJOIcon, UEAIcon } from './icons';

/** @jsx React.createElement */

function NavItem (props) {
    const { id, icon, url } = props.item;
    return (
        <Link target={url}>
            <ListItem
                button
                selected={props.currentPage === id}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText>{locale.pages[id]}</ListItemText>
            </ListItem>
        </Link>
    );
}

NavItem.propTypes = {
    item: PropTypes.object.isRequired,
    currentPage: PropTypes.string.isRequired
};

function NavGroup (props) {
    const { id, contents } = props.item;
    return (
        <List subheader={
            <ListSubheader>
                {locale.pages[id]}
            </ListSubheader>
        }>
            {contents.map(item => (
                <NavItem
                    key={item.id}
                    item={item}
                    currentPage={props.currentPage} />
            ))}
        </List>
    );
}

NavGroup.propTypes = {
    item: PropTypes.any.isRequired,
    currentPage: PropTypes.string.isRequired
};

export default class SidebarContents extends React.PureComponent {
    static propTypes = {
        currentPage: PropTypes.string.isRequired
    };

    state = {
        searchQuery: ''
    };

    render () {
        return (
            <div className="app-sidebar-contents">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img
                            className="logo"
                            src="/assets/logo.svg"
                            draggable={0}
                            aria-hidden="true"
                            role="presentation" />
                        <img
                            className="logo-label"
                            src="/assets/logo-label.svg"
                            draggable={0}
                            aria-label="AKSO"
                            alt="AKSO" />
                    </div>
                    <div className="sidebar-user">
                        <Avatar className="user-avatar" />
                        <Typography
                            className="user-name"
                            variant="subtitle1"
                            color="inherit">
                            fsjdakfhsdajkhfhfdjskfhdsjakl
                        </Typography>
                        <IconButton color="inherit" class="user-options">
                            <ExpandMoreIcon color="inherit" />
                        </IconButton>
                    </div>
                </div>
                <div className="sidebar-nav-container">
                    <div className="sidebar-nav">
                        <TextField
                            className="search-input"
                            placeholder={locale.sidebar.search}
                            value={this.state.searchQuery}
                            onInput={e => this.setState({ searchQuery: e.target.value })}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }} />
                        <nav className="sidebar-nav-list" role="navigation">
                            {ROUTES.map(item => (
                                <NavGroup
                                    key={item[0]}
                                    item={item}
                                    currentPage={this.props.currentPage} />
                            ))}
                        </nav>
                    </div>
                    <div className="sidebar-meta-info">
                        <div className="info-logos">
                            <UEAIcon />
                            <TEJOIcon />
                        </div>
                        <div className="info-line">
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
                    </div>
                </div>
            </div>
        );
    }
}
