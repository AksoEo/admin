import { h } from 'preact';
import moment from 'moment';
import {
    timestampFormat, timestampTzFormat, timestampFormatToday, timestampTzFormatToday,
} from '../../locale';
import date from './date';
import time from './time';
import './style';

function stringify (value, zone) {
    if (value) {
        const applyZone = time => {
            if (!zone) return time.utc();
            return time.tz(zone);
        };
        const m = applyZone(moment(value * 1000));
        const mlt = moment(value * 1000);
        const now = applyZone(moment());
        if (m.year() === now.year() && m.dayOfYear() === now.dayOfYear()
            && mlt.dayOfYear() === moment().dayOfYear()) {
            // is today in both UTC and local time
            // we don't want to show “today” if it’s not today in local time to avoid confusion
            return m.format(zone ? timestampTzFormatToday : timestampFormatToday);
        }
        return m.format(zone ? timestampTzFormat : timestampFormat);
    }
    return null;
}

/// Renders a formatted timestamp (not editable). Use prop `value` (in seconds).
///
/// # Additional Props
/// - zone: time zone
function TimestampFormatter ({ value, zone }) {
    return stringify(value, zone);
}

/// Edits a timestamp.
///
/// # Props
/// - value (in seconds)
function TimestampEditor ({ label, value, onChange, disabled, error, outline, zone }) {
    const applyZone = value => {
        if (zone) return value.tz(zone);
        return value.utc();
    };
    const parseZone = (value, format) => {
        if (zone) return moment.tz(value, format, zone);
        return moment.utc(value, format);
    };

    const valueIsNullish = value === null || value === undefined;

    const m = applyZone(moment(Number.isFinite(value) ? value * 1000 : value));

    const dateValue = valueIsNullish ? null : m.format('YYYY-MM-DD');
    const timeValue = valueIsNullish ? null : m.hour() * 3600 + m.minute() * 60 + m.second();

    return (
        <span class="timestamp-editor">
            <date.editor label={label} outline={outline} disabled={disabled} value={dateValue} onChange={v => {
                if (v === null) {
                    onChange(null);
                    return;
                }
                const newDate = parseZone(v + '$00:00:00', 'YYYY-MM-DD$HH:mm:ss');
                newDate.seconds(timeValue);
                const newValue = newDate.unix();
                if (Number.isFinite(newValue)) onChange(newValue);
            }} error={error} />
            {outline ? ' ' : ''}
            <time.editor nullable outline={outline} disabled={disabled} value={timeValue} onChange={v => {
                if (v === null) {
                    onChange(null);
                    return;
                }
                const newDate = parseZone(dateValue + '$00:00:00', 'YYYY-MM-DD$HH:mm:ss');
                newDate.seconds(v);
                const newValue = newDate.unix();
                if (Number.isFinite(newValue)) onChange(newValue);
            }} error={!!error} />
        </span>
    );
}

export default {
    renderer: TimestampFormatter,
    inlineRenderer: TimestampFormatter,
    editor: TimestampEditor,
    stringify,
};

