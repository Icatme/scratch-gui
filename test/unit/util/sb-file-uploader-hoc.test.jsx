import 'web-audio-test-api';

import React from 'react';
import configureStore from 'redux-mock-store';
import {mountWithIntl, shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import {LoadingState} from '../../../src/reducers/project-state';
import VM from 'scratch-vm';

import SBFileUploaderHOC from '../../../src/lib/sb-file-uploader-hoc.jsx';

describe('SBFileUploaderHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;
    let originalFetch;
    let originalAlert;

    // Wrap this in a function so it gets test specific states and can be reused.
    const getContainer = function () {
        const Component = () => <div />;
        return SBFileUploaderHOC(Component);
    };

    const shallowMountWithContext = component => (
        shallowWithIntl(component, {context: {store}})
    );

    const unwrappedInstance = () => {
        const WrappedComponent = getContainer();
        // default starting state: looking at a project you created, not logged in
        const wrapper = shallowMountWithContext(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={jest.fn()}
                closeFileMenu={jest.fn()}
                requestProjectUpload={jest.fn()}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onSetProjectTitle={jest.fn()}
            />
        );
        return wrapper
            .dive() // unwrap intl
            .dive() // unwrap redux Connect(SBFileUploaderComponent)
            .instance(); // SBFileUploaderComponent
    };

    const createUploader = (props = {}) => {
        const WrappedComponent = getContainer();
        const defaultProps = {
            canSave: false,
            cancelFileUpload: jest.fn(),
            closeFileMenu: jest.fn(),
            loadingState: LoadingState.SHOWING_WITHOUT_ID,
            onLoadingFinished: jest.fn(),
            onLoadingStarted: jest.fn(),
            onSetProjectTitle: jest.fn(),
            projectChanged: false,
            requestProjectUpload: jest.fn(),
            userOwnsProject: false,
            vm: {
                loadProject: jest.fn(() => Promise.resolve())
            }
        };
        const wrapper = shallowMountWithContext(
            <WrappedComponent
                {...defaultProps}
                {...props}
            />
        );
        const componentWrapper = wrapper
            .dive() // unwrap intl
            .dive(); // unwrap redux Connect(SBFileUploaderComponent)
        return {
            wrapper: componentWrapper,
            instance: componentWrapper.instance(),
            props: componentWrapper.props(),
            providedProps: {...defaultProps, ...props}
        };
    };

    const flushPromises = () => new Promise(resolve => setImmediate(resolve));

    beforeAll(() => {
        originalFetch = global.fetch;
        originalAlert = global.alert;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        global.alert = originalAlert;
    });

    beforeEach(() => {
        vm = new VM();
        store = mockStore({
            scratchGui: {
                projectState: {
                    loadingState: LoadingState.SHOWING_WITHOUT_ID
                },
                vm: {}
            },
            locales: {
                locale: 'en'
            }
        });
    });

    test('correctly sets title with .sb3 filename', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great.sb3');
        expect(projectName).toBe('my project is great');
    });

    test('correctly sets title with .sb2 filename', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great.sb2');
        expect(projectName).toBe('my project is great');
    });

    test('correctly sets title with .sb filename', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great.sb');
        expect(projectName).toBe('my project is great');
    });

    test('sets blank title with filename with no extension', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great');
        expect(projectName).toBe('');
    });

    test('if isLoadingUpload becomes true, without fileToUpload set, will call cancelFileUpload', () => {
        const mockedCancelFileUpload = jest.fn();
        const WrappedComponent = getContainer();
        const mounted = mountWithIntl(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={mockedCancelFileUpload}
                closeFileMenu={jest.fn()}
                isLoadingUpload={false}
                requestProjectUpload={jest.fn()}
                store={store}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onSetProjectTitle={jest.fn()}
            />
        );
        mounted.setProps({
            isLoadingUpload: true
        });
        expect(mockedCancelFileUpload).toHaveBeenCalled();
    });

    test('handleStartLoadingProjectUrl triggers upload request', () => {
        const requestProjectUpload = jest.fn();
        const closeFileMenu = jest.fn();
        const {instance} = createUploader({
            projectChanged: false,
            requestProjectUpload,
            closeFileMenu
        });

        instance.handleStartLoadingProjectUrl('https://example.com/project.sb3');

        expect(instance.projectUrlToUpload).toBe('https://example.com/project.sb3');
        expect(instance.uploadSource).toBe('url');
        expect(requestProjectUpload).toHaveBeenCalledWith(instance.props.loadingState);
        expect(closeFileMenu).toHaveBeenCalled();
    });

    test('removeFileObjects clears url state', () => {
        const {instance} = createUploader();
        instance.projectUrlToUpload = 'https://example.com/project.sb3';
        instance.uploadSource = 'url';

        instance.removeFileObjects();

        expect(instance.projectUrlToUpload).toBeNull();
        expect(instance.uploadSource).toBeNull();
    });

    test('handleFinishedLoadingUpload loads project from url', async () => {
        const arrayBuffer = new ArrayBuffer(8);
        const loadProject = jest.fn(() => Promise.resolve());
        const onLoadingStarted = jest.fn();
        const onLoadingFinished = jest.fn();
        const onSetProjectTitle = jest.fn();
        const {instance} = createUploader({
            onLoadingFinished,
            onLoadingStarted,
            onSetProjectTitle,
            vm: {loadProject}
        });
        const originalRemoveFileObjects = instance.removeFileObjects;
        const removeFileObjectsSpy = jest.fn(() => originalRemoveFileObjects.call(instance));
        instance.removeFileObjects = removeFileObjectsSpy;

        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(arrayBuffer)
        }));
        global.alert = jest.fn();

        instance.uploadSource = 'url';
        instance.projectUrlToUpload = 'https://example.com/project.sb3?download=1';

        await instance.handleFinishedLoadingUpload();
        await flushPromises();

        expect(global.fetch).toHaveBeenCalledWith('https://example.com/project.sb3?download=1');
        expect(onLoadingStarted).toHaveBeenCalled();
        expect(loadProject).toHaveBeenCalledWith(arrayBuffer);
        expect(onSetProjectTitle).toHaveBeenCalledWith('project');
        expect(onLoadingFinished).toHaveBeenCalledWith(instance.props.loadingState, true);
        expect(global.alert).not.toHaveBeenCalled();
        expect(removeFileObjectsSpy).toHaveBeenCalled();
    });

    test('handleFinishedLoadingUpload handles url load errors', async () => {
        const loadProject = jest.fn(() => Promise.reject(new Error('failed')));
        const onLoadingFinished = jest.fn();
        const onLoadingStarted = jest.fn();
        const {instance} = createUploader({
            onLoadingFinished,
            onLoadingStarted,
            vm: {loadProject}
        });
        const originalRemoveFileObjects = instance.removeFileObjects;
        const removeFileObjectsSpy = jest.fn(() => originalRemoveFileObjects.call(instance));
        instance.removeFileObjects = removeFileObjectsSpy;

        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(4))
        }));
        global.alert = jest.fn();

        instance.uploadSource = 'url';
        instance.projectUrlToUpload = 'https://example.com/error.sb3';

        await instance.handleFinishedLoadingUpload();
        await flushPromises();

        expect(onLoadingStarted).toHaveBeenCalled();
        expect(loadProject).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalled();
        expect(onLoadingFinished).toHaveBeenCalledWith(instance.props.loadingState, false);
        expect(removeFileObjectsSpy).toHaveBeenCalled();
    });
});
