import { h } from 'preact';
import { Fragment } from 'preact/compat';

function YellingAsterisk () {
    return <span class="data yelling-asterisk">*</span>;
}

export default function Required ({ children }) {
    return <Fragment>{children}<YellingAsterisk /></Fragment>;
}