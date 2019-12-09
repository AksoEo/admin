import { h } from 'preact';
import { useState } from 'preact/compat';
import { TextField, Slider } from '@cpsdqs/yamdl';
import './range-editor.less';

/// A text editor optimized for editing integer range bounds.
///
/// # Props
/// - `min`: the minimum value
/// - `max`: the maximum value
/// - `value`/`onChange`: the range bound value/change callback
/// - `minSoftBound`: the minimum value at which changes will be committed while typing a number.
///   Since numbers are typed digit-by-digit, their magnitude will usually increase from a very
///   small value. However, if the user is editing the upper bound with a lower bound set to K,
///   having the input *always* commit the values would be detrimental when the user starts typing
///   and the value is momentarily less than K, thus clamping the lower bound. Hence, minSoftBound
///   should be used on upper bounds to restrict the area in which they will live-update and thus
///   prevent modifying the lower bound unnecessarily.
export function BoundEditor ({ min, max, minSoftBound, value, onChange }) {
    const [isFocused, setFocused] = useState(false);
    const [tmpValue, setTmpValue] = useState(value);

    const bindValue = v => Math.max(min, Math.min(v | 0, max));
    const softBindValue = v => {
        if (!v) return v;
        v = parseInt('' + v) | 0;
        if (min >= 0 && v < 0) v = -v;
        if (v > max) v = max;
        return v;
    };

    const commit = () => {
        onChange(bindValue(tmpValue));
    };

    const onFocus = () => {
        setTmpValue(value);
        setFocused(true);
    };
    const onBlur = () => {
        setFocused(false);
        commit();
    };
    const onInputChange = e => {
        if (isFocused) {
            const softBound = softBindValue(e.target.value);
            setTmpValue(softBound);
            const bound = bindValue(softBound);
            if (softBound === bound && bound > minSoftBound) onChange(bound);
        } else commit();
    };
    const onKeyDown = e => {
        if (e.key === 'Enter') e.target.blur();
    };

    return (
        <TextField
            type="number"
            class="bound-editor"
            center
            min={min}
            max={max}
            onFocus={onFocus}
            onBlur={onBlur}
            value={isFocused ? tmpValue : value}
            onKeyDown={onKeyDown}
            onChange={onInputChange} />
    );
}

/// Renders a range editor with inputs on either side.
export default function RangeEditor ({ min, max, value, onChange, tickDistance, disabled }) {
    return (
        <div class={'range-editor' + (disabled ? ' disabled' : '')}>
            <BoundEditor
                min={min}
                max={max}
                minSoftBound={min}
                value={value[0]}
                onChange={val => onChange([val, Math.max(val, value[1])])}/>
            <Slider
                min={min}
                max={max}
                value={value}
                popout
                discrete
                tickDistance={tickDistance}
                class="editor-inner"
                onChange={value => onChange(value)} />
            <BoundEditor
                min={min}
                max={max}
                minSoftBound={value[0]}
                value={value[1]}
                onChange={val => onChange([Math.min(val, value[0]), val])}/>
        </div>
    );
}