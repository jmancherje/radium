/** @flow */

import {isEmpty} from 'lodash/lang';
import {forOwn} from 'lodash/object';

function filterStyle(style) {

    const pseudo = {};
    const media = {};
    const rest = {};

    forOwn(style, (value, key) => {
        if (key.startsWith('@media')) {
            media[key] = value;
        } else if (key.startsWith(':')) {
            pseudo[key] = value;
        } else {
            rest[key] = value;
        }
    });

    return {
        pseudo,
        media,
        rest,
    };
}

function pseudoToCSS({
    addCSS,
    cssRuleSetToString,
    hash,
    scopeSelector,
    style,
    userAgent,
}) {

    const scope = scopeSelector || '';
    const classNames = [];

    forOwn(style, (value, pseudo) => {
        const ruleCSS = cssRuleSetToString(
            '',
            value,
            userAgent
        );

        const className = `pseudo-${hash(scope + pseudo + ruleCSS)}`;
        let css = `.${className}${pseudo} ${ruleCSS}`;

        if (scope) {
            css = `${scope}{${css}}`;
        }

        addCSS(css);
        classNames.push(className);

    });

    return classNames;
}

function mediaToCSS({
    addCSS,
    cssRuleSetToString,
    hash,
    style,
    userAgent,
}) {

    const classNames = [];

    forOwn(style, (value, query) => {
        const {pseudo, rest} = filterStyle(value);

        if (!isEmpty(rest)) {
            const ruleCSS = cssRuleSetToString(
                '',
                rest,
                userAgent
            );

            // CSS classes cannot start with a number
            const className = `media-${hash(query + ruleCSS)}`;
            const css = `${query}{.${className}${ruleCSS}}`;
            addCSS(css);

            classNames.push(className);
        }

        if (!isEmpty(pseudo)) {

            classNames.push(...pseudoToCSS({
                addCSS,
                cssRuleSetToString,
                hash,
                style: pseudo,
                userAgent,
                scopeSelector: query
            }));
        }
    });

    return classNames;
}

export default ({
    addCSS,
    appendImportantToEachValue,
    config: {userAgent},
    cssRuleSetToString,
    hash,
    props,
    style
}: Object): Object => {

    const {pseudo, media, rest} = filterStyle(style);
    const classNames = [];

    if (props.className) {
        classNames.push(props.className);
    }

    if (!isEmpty(media)) {
        classNames.push(...mediaToCSS({
            addCSS,
            appendImportantToEachValue,
            cssRuleSetToString,
            hash,
            style: media,
            userAgent
        }));
    }

    if (!isEmpty(pseudo)) {
        classNames.push(...pseudoToCSS({
            addCSS,
            appendImportantToEachValue,
            cssRuleSetToString,
            hash,
            style: pseudo,
            userAgent,
            scopeSelector: ''
        }));
    }

    const newProps = {
        className: classNames.join(' ')
    };

    return {
        props: newProps,
        style: rest
    };
};
