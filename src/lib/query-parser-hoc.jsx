import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import {connect} from 'react-redux';

import {detectTutorialId} from './tutorial-from-url';

import {activateDeck} from '../reducers/cards';
import {openTipsLibrary} from '../reducers/modals';
import {getIsShowingProject} from '../reducers/project-state';
import {ProjectUrlDebugChain, logProjectUrlDebug} from './project-url-debug';

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
            this.projectUrlFromQuery = this.getProjectUrlFromQuery(queryParams);
            this.hasLoadedProjectFromQuery = false;
            logProjectUrlDebug('query-parser-hoc', 'Constructor parsed query params', {
                projectUrl: this.projectUrlFromQuery,
                tutorialId
            }, ProjectUrlDebugChain.QUERY);
        }
        componentDidMount () {
            this.maybeLoadProjectFromQuery();
        }
        componentDidUpdate () {
            this.maybeLoadProjectFromQuery();
        }
        maybeLoadProjectFromQuery () {
           // alert('maybeLoadProjectFromQuery');
            
            if (!this.projectUrlFromQuery) {
                logProjectUrlDebug('query-parser-hoc', 'Skipping auto-load: no project URL in query', {}, ProjectUrlDebugChain.QUERY);
                return;
            }
            if (this.hasLoadedProjectFromQuery) {
                logProjectUrlDebug('query-parser-hoc', 'Skipping auto-load: project already loaded from query', {
                    projectUrl: this.projectUrlFromQuery
                }, ProjectUrlDebugChain.QUERY);
                return;
            }
            if (!this.props.isShowingProject) {
                logProjectUrlDebug('query-parser-hoc', 'Deferring auto-load until GUI is showing project', {
                    projectUrl: this.projectUrlFromQuery
                }, ProjectUrlDebugChain.QUERY);
                return;
            }
           // alert(typeof this.props.onStartLoadingProjectUrl);
            if (typeof this.props.onStartLoadingProjectUrl === 'function') {
               // alert('Loading project from URL: ' + this.projectUrlFromQuery);
                this.hasLoadedProjectFromQuery = true;
                logProjectUrlDebug('query-parser-hoc', 'Dispatching auto-load from query project URL', {
                    projectUrl: this.projectUrlFromQuery
                }, ProjectUrlDebugChain.QUERY);
                this.props.onStartLoadingProjectUrl(this.projectUrlFromQuery, {chain: ProjectUrlDebugChain.QUERY});
            } else {
                alert('No handler to load project from URL');
                logProjectUrlDebug('query-parser-hoc', 'Auto-load handler missing; skipping', {
                    projectUrl: this.projectUrlFromQuery
                }, ProjectUrlDebugChain.QUERY);
            }
        }
        getProjectUrlFromQuery (queryParams) {
            const projectUrlKeys = [
                'project_url',
                'projectUrl',
                'sb3',
                'sb3_url',
                'sb3Url'
            ];
            for (const key of projectUrlKeys) {
                if (!Object.prototype.hasOwnProperty.call(queryParams, key)) {
                    continue;
                }
                const rawValue = queryParams[key];
                const candidate = Array.isArray(rawValue) ?
                    rawValue.find(value => typeof value === 'string' && value.trim()) :
                    rawValue;
                if (typeof candidate === 'string') {
                    const trimmedCandidate = candidate.trim();
                    if (trimmedCandidate) {
                        logProjectUrlDebug('query-parser-hoc', 'Found project URL in query', {key, trimmedCandidate}, ProjectUrlDebugChain.QUERY);
                        return trimmedCandidate;
                    }
                }
            }
            logProjectUrlDebug('query-parser-hoc', 'No usable project URL found in query', {
                keys: Object.keys(queryParams || {})
            }, ProjectUrlDebugChain.QUERY);
            return null;
        }
        setActiveCards (tutorialId) {
            this.props.onUpdateReduxDeck(tutorialId);
        }
        openTutorials () {
            this.props.onOpenTipsLibrary();
        }
        render () {
            const {
                isShowingProject, // eslint-disable-line no-unused-vars
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
        isShowingProject: PropTypes.bool,
        onOpenTipsLibrary: PropTypes.func,
        onStartLoadingProjectUrl: PropTypes.func,
        onUpdateReduxDeck: PropTypes.func
    };
    const mapStateToProps = state => ({
        isShowingProject: getIsShowingProject(state.scratchGui.projectState.loadingState)
    });
    const mapDispatchToProps = dispatch => ({
        onOpenTipsLibrary: () => {
            dispatch(openTipsLibrary());
        },
        onUpdateReduxDeck: tutorialId => {
            dispatch(activateDeck(tutorialId));
        }
    });
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(QueryParserComponent);
};

export {
    QueryParserHOC as default
};
