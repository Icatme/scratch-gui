import React from 'react';
import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';
import {mount} from 'enzyme';

jest.mock('query-string', () => ({
    __esModule: true,
    default: {
        parse: jest.fn()
    }
}));

import queryString from 'query-string';
import QueryParserHOC from '../../../src/lib/query-parser-hoc.jsx';

const mockStore = configureStore();

describe('QueryParserHOC', () => {
    let store;

    beforeEach(() => {
        store = mockStore({});
        queryString.parse.mockReturnValue({});
    });

    test('triggers URL loading from project_url query parameter', () => {
        const projectUrl = 'http://localhost:8090/api/projects/4/scratch-file';
        queryString.parse.mockReturnValue({project_url: projectUrl});

        const onStartLoadingProjectUrl = jest.fn();
        const Component = () => <div />;
        const WrappedComponent = QueryParserHOC(Component);

        const wrapper = mount(
            <Provider store={store}>
                <WrappedComponent onStartLoadingProjectUrl={onStartLoadingProjectUrl} />
            </Provider>
        );

        expect(queryString.parse).toHaveBeenCalledWith(window.location.search);
        expect(onStartLoadingProjectUrl).toHaveBeenCalledWith(projectUrl);

        wrapper.unmount();
    });

    test('supports url query parameter alias', () => {
        const projectUrl = 'https://example.com/my-project.sb3';
        queryString.parse.mockReturnValue({url: projectUrl});

        const onStartLoadingProjectUrl = jest.fn();
        const Component = () => <div />;
        const WrappedComponent = QueryParserHOC(Component);

        const wrapper = mount(
            <Provider store={store}>
                <WrappedComponent onStartLoadingProjectUrl={onStartLoadingProjectUrl} />
            </Provider>
        );

        expect(onStartLoadingProjectUrl).toHaveBeenCalledWith(projectUrl);

        wrapper.unmount();
    });
});
