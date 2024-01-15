import { SessionIdManager } from './sessionid';
import { PostHogPersistence } from './posthog-persistence';
interface SessionSourceProps {
    initialPathName: string;
    referringDomain: string;
    utm_medium?: string;
    utm_source?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
}
interface StoredSessionSourceProps {
    sessionId: string;
    props: SessionSourceProps;
}
export declare class SessionPropsManager {
    private readonly _sessionIdManager;
    private readonly _persistence;
    private readonly _sessionSourceParamGenerator;
    constructor(sessionIdManager: SessionIdManager, persistence: PostHogPersistence, sessionSourceParamGenerator?: () => SessionSourceProps);
    _getStoredProps(): StoredSessionSourceProps | undefined;
    _onSessionIdCallback: (sessionId: string) => void;
    getSessionProps(): {
        $client_session_initial_referring_host?: undefined;
        $client_session_initial_pathname?: undefined;
        $client_session_initial_utm_source?: undefined;
        $client_session_initial_utm_campaign?: undefined;
        $client_session_initial_utm_medium?: undefined;
        $client_session_initial_utm_content?: undefined;
        $client_session_initial_utm_term?: undefined;
    } | {
        $client_session_initial_referring_host: string;
        $client_session_initial_pathname: string;
        $client_session_initial_utm_source: string | undefined;
        $client_session_initial_utm_campaign: string | undefined;
        $client_session_initial_utm_medium: string | undefined;
        $client_session_initial_utm_content: string | undefined;
        $client_session_initial_utm_term: string | undefined;
    };
}
export {};
