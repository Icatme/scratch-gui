import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import {connect} from 'react-redux';

import {detectTutorialId} from './tutorial-from-url';

import {activateDeck} from '../reducers/cards';
import {openTipsLibrary} from '../reducers/modals';

const PROJECT_URL_QUERY_KEYS = [
    'project_url',
    'projectUrl',
    'url'
];

/* Higher Order Component to get parameters from the URL query string and initialize redux state
 * @param {React.Component} WrappedComponent: component to render
 * @returns {React.Component} component with query parsing behavior
 */
const QueryParserHOC = function (WrappedComponent) {
    class QueryParserComponent extends React.Component {
        constructor (props) {
            super(props);
            const queryParams = queryString.parse(location.search);
            const tutorialId = detectTutorialId(queryParams);
            if (tutorialId) {
                if (tutorialId === 'all') {
                    this.openTutorials();
                } else {
                    this.setActiveCards(tutorialId);
                }
            }

            this.projectUrlFromQuery = this.getProjectUrlFromParams(queryParams);
        }
        componentDidMount () {
            this.attemptToLoadProjectUrl();
        }
        componentDidUpdate () {
            this.attemptToLoadProjectUrl();
        }
        setActiveCards (tutorialId) {
            this.props.onUpdateReduxDeck(tutorialId);
        }
        openTutorials () {
            this.props.onOpenTipsLibrary();
        }
        getProjectUrlFromParams (queryParams) {
            for (const key of PROJECT_URL_QUERY_KEYS) {
                if (!Object.prototype.hasOwnProperty.call(queryParams, key)) continue;
                const value = queryParams[key];
                const candidate = Array.isArray(value) ? value.find(item => typeof item === 'string' && item.trim()) : value;
                if (typeof candidate === 'string') {
                    const trimmed = candidate.trim();
                    if (trimmed) {
                        return trimmed;
                    }
                }
            }
            return null;
        }
        attemptToLoadProjectUrl () {
            if (!this.projectUrlFromQuery) return;
            if (typeof this.props.onStartLoadingProjectUrl !== 'function') return;
            const urlToLoad = this.projectUrlFromQuery;
            this.projectUrlFromQuery = null;
            this.props.onStartLoadingProjectUrl(urlToLoad);
        }
        render () {
            const {
                onOpenTipsLibrary, // eslint-disable-line no-unused-vars
                onUpdateReduxDeck, // eslint-disable-line no-unused-vars
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    {...componentProps}
                />
            );
        }
    }
    QueryParserComponent.propTypes = {
        onOpenTipsLibrary: PropTypes.func,
        onStartLoadingProjectUrl: PropTypes.func,
        onUpdateReduxDeck: PropTypes.func
    };
    const mapDispatchToProps = dispatch => ({
        onOpenTipsLibrary: () => {
            dispatch(openTipsLibrary());
        },
        onUpdateReduxDeck: tutorialId => {
            dispatch(activateDeck(tutorialId));
        }
    });
    return connect(
        null,
        mapDispatchToProps
    )(QueryParserComponent);
};

export {
    QueryParserHOC as default
};
