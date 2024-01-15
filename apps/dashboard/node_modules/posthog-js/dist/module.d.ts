declare enum NodeType {
    Document = 0,
    DocumentType = 1,
    Element = 2,
    Text = 3,
    CDATA = 4,
    Comment = 5
}
type documentNode = {
    type: NodeType.Document;
    childNodes: serializedNodeWithId[];
    compatMode?: string;
};
type documentTypeNode = {
    type: NodeType.DocumentType;
    name: string;
    publicId: string;
    systemId: string;
};
type attributes = {
    [key: string]: string | number | true | null;
};
type elementNode = {
    type: NodeType.Element;
    tagName: string;
    attributes: attributes;
    childNodes: serializedNodeWithId[];
    isSVG?: true;
    needBlock?: boolean;
};
type textNode = {
    type: NodeType.Text;
    textContent: string;
    isStyle?: true;
};
type cdataNode = {
    type: NodeType.CDATA;
    textContent: '';
};
type commentNode = {
    type: NodeType.Comment;
    textContent: string;
};
type serializedNode = (documentNode | documentTypeNode | elementNode | textNode | cdataNode | commentNode) & {
    rootId?: number;
    isShadowHost?: boolean;
    isShadow?: boolean;
};
type serializedNodeWithId = serializedNode & {
    id: number;
};
type MaskInputOptions = Partial<{
    color: boolean;
    date: boolean;
    'datetime-local': boolean;
    email: boolean;
    month: boolean;
    number: boolean;
    range: boolean;
    search: boolean;
    tel: boolean;
    text: boolean;
    time: boolean;
    url: boolean;
    week: boolean;
    textarea: boolean;
    select: boolean;
    password: boolean;
}>;
type SlimDOMOptions = Partial<{
    script: boolean;
    comment: boolean;
    headFavicon: boolean;
    headWhitespace: boolean;
    headMetaDescKeywords: boolean;
    headMetaSocial: boolean;
    headMetaRobots: boolean;
    headMetaHttpEquiv: boolean;
    headMetaAuthorship: boolean;
    headMetaVerification: boolean;
}>;

declare class RequestQueueScaffold {
    isPolling: boolean;
    _event_queue: any[];
    _empty_queue_count: number;
    _poller: number | undefined;
    _pollInterval: number;
    constructor(pollInterval?: number);
    setPollInterval(interval: number): void;
    poll(): void;
    unload(): void;
    getTime(): number;
}

declare class RateLimiter {
    limits: Record<string, number>;
    isRateLimited(batchKey: string | undefined): boolean;
    checkForLimiting: (xmlHttpRequest: XMLHttpRequest) => void;
}

declare class RetryQueue extends RequestQueueScaffold {
    queue: RetryQueueElement[];
    isPolling: boolean;
    areWeOnline: boolean;
    onXHRError: (failedRequest: XMLHttpRequest) => void;
    rateLimiter: RateLimiter;
    constructor(onXHRError: (failedRequest: XMLHttpRequest) => void, rateLimiter: RateLimiter);
    enqueue(requestData: QueuedRequestData): void;
    poll(): void;
    flush(): void;
    unload(): void;
    _executeXhrRequest({ url, data, options, headers, callback, retriesPerformedSoFar }: QueuedRequestData): void;
    _handleWeAreNowOnline(): void;
}

declare type Property = any;
declare type Properties = Record<string, Property>;
interface CaptureResult {
    uuid: string;
    event: string;
    properties: Properties;
    $set?: Properties;
    $set_once?: Properties;
    timestamp?: Date;
}
declare type CaptureCallback = (response: any, data: any) => void;
declare type AutocaptureCompatibleElement = 'a' | 'button' | 'form' | 'input' | 'select' | 'textarea' | 'label';
declare type DomAutocaptureEvents = 'click' | 'change' | 'submit';
/**
 * If an array is passed for an allowlist, autocapture events will only be sent for elements matching
 * at least one of the elements in the array. Multiple allowlists can be used
 */
interface AutocaptureConfig {
    /**
     * List of URLs to allow autocapture on, can be strings to match
     * or regexes e.g. ['https://example.com', 'test.com/.*']
     */
    url_allowlist?: (string | RegExp)[];
    /**
     * List of DOM events to allow autocapture on  e.g. ['click', 'change', 'submit']
     */
    dom_event_allowlist?: DomAutocaptureEvents[];
    /**
     * List of DOM elements to allow autocapture on
     * e.g. ['a', 'button', 'form', 'input', 'select', 'textarea', 'label']
     */
    element_allowlist?: AutocaptureCompatibleElement[];
    /**
     * List of CSS selectors to allow autocapture on
     * e.g. ['[ph-capture]']
     */
    css_selector_allowlist?: string[];
    /**
     * Exclude certain element attributes from autocapture
     * E.g. ['aria-label'] or [data-attr-pii]
     */
    element_attribute_ignorelist?: string[];
}
declare type UUIDVersion = 'og' | 'v7';
interface PostHogConfig {
    api_host: string;
    api_method: string;
    api_transport: string;
    ui_host: string | null;
    token: string;
    autocapture: boolean | AutocaptureConfig;
    rageclick: boolean;
    cross_subdomain_cookie: boolean;
    persistence: 'localStorage' | 'cookie' | 'memory' | 'localStorage+cookie' | 'sessionStorage';
    persistence_name: string;
    cookie_name: string;
    loaded: (posthog_instance: PostHog) => void;
    store_google: boolean;
    custom_campaign_params: string[];
    custom_blocked_useragents: string[];
    save_referrer: boolean;
    verbose: boolean;
    capture_pageview: boolean;
    capture_pageleave: boolean;
    debug: boolean;
    cookie_expiration: number;
    upgrade: boolean;
    disable_session_recording: boolean;
    disable_persistence: boolean;
    /** @deprecated - use `disable_persistence` instead  */
    disable_cookie: boolean;
    enable_recording_console_log?: boolean;
    secure_cookie: boolean;
    ip: boolean;
    opt_out_capturing_by_default: boolean;
    opt_out_persistence_by_default: boolean;
    opt_out_capturing_persistence_type: 'localStorage' | 'cookie';
    opt_out_capturing_cookie_prefix: string | null;
    opt_in_site_apps: boolean;
    respect_dnt: boolean;
    property_blacklist: string[];
    xhr_headers: {
        [header_name: string]: string;
    };
    on_xhr_error: (failedRequest: XMLHttpRequest) => void;
    inapp_protocol: string;
    inapp_link_new_window: boolean;
    request_batching: boolean;
    sanitize_properties: ((properties: Properties, event_name: string) => Properties) | null;
    properties_string_max_length: number;
    session_recording: SessionRecordingOptions;
    session_idle_timeout_seconds: number;
    mask_all_element_attributes: boolean;
    mask_all_text: boolean;
    advanced_disable_decide: boolean;
    advanced_disable_feature_flags: boolean;
    advanced_disable_feature_flags_on_first_load: boolean;
    advanced_disable_toolbar_metrics: boolean;
    get_device_id: (uuid: string) => string;
    name: string;
    callback_fn: string;
    _onCapture: (eventName: string, eventData: CaptureResult) => void;
    capture_performance?: boolean;
    disable_compression: boolean;
    bootstrap: {
        distinctID?: string;
        isIdentifiedID?: boolean;
        featureFlags?: Record<string, boolean | string>;
        featureFlagPayloads?: Record<string, JsonType>;
    };
    segment?: any;
    __preview_measure_pageview_stats?: boolean;
    __preview_send_client_session_params?: boolean;
}
interface OptInOutCapturingOptions {
    capture: (event: string, properties: Properties, options: CaptureOptions) => void;
    capture_event_name: string;
    capture_properties: Properties;
    enable_persistence: boolean;
    clear_persistence: boolean;
    persistence_type: 'cookie' | 'localStorage' | 'localStorage+cookie';
    cookie_prefix: string;
    cookie_expiration: number;
    cross_subdomain_cookie: boolean;
    secure_cookie: boolean;
}
interface isFeatureEnabledOptions {
    send_event: boolean;
}
interface SessionRecordingOptions {
    blockClass?: string | RegExp;
    blockSelector?: string | null;
    ignoreClass?: string;
    maskTextClass?: string | RegExp;
    maskTextSelector?: string | null;
    maskTextFn?: ((text: string) => string) | null;
    maskAllInputs?: boolean;
    maskInputOptions?: MaskInputOptions;
    maskInputFn?: ((text: string, element?: HTMLElement) => string) | null;
    slimDOMOptions?: SlimDOMOptions | 'all' | true;
    collectFonts?: boolean;
    inlineStylesheet?: boolean;
    recorderVersion?: 'v1' | 'v2';
    recordCrossOriginIframes?: boolean;
    /** @deprecated - use maskCapturedNetworkRequestFn instead  */
    maskNetworkRequestFn?: ((data: NetworkRequest) => NetworkRequest | null | undefined) | null;
    /** Modify the network request before it is captured. Returning null or undefined stops it being captured */
    maskCapturedNetworkRequestFn?: ((data: CapturedNetworkRequest) => CapturedNetworkRequest | null | undefined) | null;
    initiatorTypes?: InitiatorType[];
    recordHeaders?: boolean | {
        request: boolean;
        response: boolean;
    };
    recordBody?: boolean | string[] | {
        request: boolean | string[];
        response: boolean | string[];
    };
}
declare type SessionIdChangedCallback = (sessionId: string, windowId: string | null | undefined) => void;
declare enum Compression {
    GZipJS = "gzip-js",
    Base64 = "base64"
}
interface XHROptions {
    transport?: 'XHR' | 'sendBeacon';
    method?: 'POST' | 'GET';
    urlQueryArgs?: {
        compression: Compression;
    };
    verbose?: boolean;
    blob?: boolean;
    sendBeacon?: boolean;
}
interface CaptureOptions extends XHROptions {
    $set?: Properties; /** used with $identify */
    $set_once?: Properties; /** used with $identify */
    _batchKey?: string; /** key of queue, e.g. 'sessionRecording' vs 'event' */
    _metrics?: Properties;
    _noTruncate?: boolean; /** if set, overrides and disables config.properties_string_max_length */
    endpoint?: string; /** defaults to '/e/' */
    send_instantly?: boolean; /** if set skips the batched queue */
    timestamp?: Date;
}
interface RetryQueueElement {
    retryAt: Date;
    requestData: QueuedRequestData;
}
interface QueuedRequestData {
    url: string;
    data: Properties;
    options: CaptureOptions;
    headers?: Properties;
    callback?: RequestCallback;
    retriesPerformedSoFar?: number;
}
interface XHRParams extends QueuedRequestData {
    retryQueue: RetryQueue;
    onXHRError: (req: XMLHttpRequest) => void;
    timeout?: number;
    onResponse?: (req: XMLHttpRequest) => void;
}
interface DecideResponse {
    status: number;
    supportedCompression: Compression[];
    config: {
        enable_collect_everything: boolean;
    };
    custom_properties: AutoCaptureCustomProperty[];
    featureFlags: Record<string, string | boolean>;
    featureFlagPayloads: Record<string, JsonType>;
    errorsWhileComputingFlags: boolean;
    autocapture_opt_out?: boolean;
    capturePerformance?: boolean;
    analytics?: {
        endpoint?: string;
    };
    elementsChainAsString?: boolean;
    autocaptureExceptions?: boolean | {
        endpoint?: string;
        errors_to_ignore: string[];
    };
    sessionRecording?: {
        endpoint?: string;
        consoleLogRecordingEnabled?: boolean;
        recorderVersion?: 'v1' | 'v2';
        sampleRate?: string | null;
        minimumDurationMilliseconds?: number;
        linkedFlag?: string | null;
        networkPayloadCapture?: Pick<NetworkRecordOptions, 'recordBody' | 'recordHeaders'>;
    };
    surveys?: boolean;
    toolbarParams: ToolbarParams;
    editorParams?: ToolbarParams; /** @deprecated, renamed to toolbarParams, still present on older API responses */
    toolbarVersion: 'toolbar'; /** @deprecated, moved to toolbarParams */
    isAuthenticated: boolean;
    siteApps: {
        id: number;
        url: string;
    }[];
}
declare type FeatureFlagsCallback = (flags: string[], variants: Record<string, string | boolean>) => void;
interface AutoCaptureCustomProperty {
    name: string;
    css_selector: string;
    event_selectors: string[];
}
interface CompressionData {
    data: string;
    compression?: Compression;
}
interface GDPROptions {
    capture?: (event: string, properties: Properties, options: CaptureOptions) => void; /** function used for capturing a PostHog event to record the opt-in action */
    captureEventName?: string; /** event name to be used for capturing the opt-in action */
    captureProperties?: Properties; /** set of properties to be captured along with the opt-in action */
    /** persistence mechanism used */
    persistenceType?: 'cookie' | 'localStorage' | 'localStorage+cookie';
    persistencePrefix?: string; /** [__ph_opt_in_out] - custom prefix to be used in the cookie/localstorage name */
    cookieExpiration?: number; /** number of days until the opt-in cookie expires */
    crossSubdomainCookie?: boolean; /** whether the opt-in cookie is set as cross-subdomain or not */
    secureCookie?: boolean; /** whether the opt-in cookie is set as secure or not */
    respectDnt?: boolean;
    window?: Window;
}
declare type RequestCallback = (response: Record<string, any>, data?: Properties) => void;
interface PersistentStore {
    is_supported: () => boolean;
    error: (error: any) => void;
    parse: (name: string) => any;
    get: (name: string) => any;
    set: (name: string, value: any, expire_days?: number | null, cross_subdomain?: boolean, secure?: boolean) => void;
    remove: (name: string, cross_subdomain?: boolean) => void;
}
declare type Breaker = {};
declare type EventHandler = (event: Event) => boolean | void;
declare type ToolbarUserIntent = 'add-action' | 'edit-action';
declare type ToolbarSource = 'url' | 'localstorage';
declare type ToolbarVersion = 'toolbar';
interface ToolbarParams {
    token?: string; /** public posthog-js token */
    temporaryToken?: string; /** private temporary user token */
    actionId?: number;
    userIntent?: ToolbarUserIntent;
    source?: ToolbarSource;
    toolbarVersion?: ToolbarVersion;
    instrument?: boolean;
    distinctId?: string;
    userEmail?: string;
    dataAttributes?: string[];
    featureFlags?: Record<string, string | boolean>;
}
interface PostData {
    buffer?: BlobPart;
    compression?: Compression;
    data?: string;
}
interface JSC {
    (): void;
    [key: string]: (response: any) => void;
}
declare type SnippetArrayItem = [method: string, ...args: any[]];
declare type JsonType = string | number | boolean | null | {
    [key: string]: JsonType;
} | Array<JsonType>;
/** A feature that isn't publicly available yet.*/
interface EarlyAccessFeature {
    name: string;
    description: string;
    stage: 'concept' | 'alpha' | 'beta';
    documentationUrl: string | null;
    flagKey: string | null;
}
declare type EarlyAccessFeatureCallback = (earlyAccessFeatures: EarlyAccessFeature[]) => void;
interface EarlyAccessFeatureResponse {
    earlyAccessFeatures: EarlyAccessFeature[];
}
declare type Headers = Record<string, string>;
declare type Body = string | Document | Blob | ArrayBufferView | ArrayBuffer | FormData | URLSearchParams | ReadableStream<Uint8Array> | null;
declare type InitiatorType = 'audio' | 'beacon' | 'body' | 'css' | 'early-hint' | 'embed' | 'fetch' | 'frame' | 'iframe' | 'icon' | 'image' | 'img' | 'input' | 'link' | 'navigation' | 'object' | 'ping' | 'script' | 'track' | 'video' | 'xmlhttprequest';
declare type NetworkRecordOptions = {
    initiatorTypes?: InitiatorType[];
    maskRequestFn?: (data: CapturedNetworkRequest) => CapturedNetworkRequest | undefined;
    recordHeaders?: boolean | {
        request: boolean;
        response: boolean;
    };
    recordBody?: boolean | string[] | {
        request: boolean | string[];
        response: boolean | string[];
    };
    recordInitialRequests?: boolean;
    recordPerformance?: boolean;
    performanceEntryTypeToObserve: string[];
    payloadSizeLimitBytes: number;
};
/** @deprecated - use CapturedNetworkRequest instead  */
declare type NetworkRequest = {
    url: string;
};
declare type CapturedNetworkRequest = Omit<PerformanceEntry, 'toJSON'> & {
    method?: string;
    initiatorType?: InitiatorType;
    status?: number;
    timeOrigin?: number;
    timestamp?: number;
    startTime?: number;
    endTime?: number;
    requestHeaders?: Headers;
    requestBody?: Body;
    responseHeaders?: Headers;
    responseBody?: Body;
    isInitial?: boolean;
};

/**
 * PostHog Persistence Object
 * @constructor
 */
declare class PostHogPersistence {
    props: Properties;
    storage: PersistentStore;
    campaign_params_saved: boolean;
    custom_campaign_params: string[];
    name: string;
    disabled: boolean | undefined;
    secure: boolean | undefined;
    expire_days: number | undefined;
    default_expiry: number | undefined;
    cross_subdomain: boolean | undefined;
    user_state: 'anonymous' | 'identified';
    constructor(config: PostHogConfig);
    properties(): Properties;
    load(): void;
    /**
     * NOTE: Saving frequently causes issues with Recordings and Consent Management Platform (CMP) tools which
     * observe cookie changes, and modify their UI, often causing infinite loops.
     * As such callers of this should ideally check that the data has changed beforehand
     */
    save(): void;
    remove(): void;
    clear(): void;
    /**
     * @param {Object} props
     * @param {*=} default_value
     * @param {number=} days
     */
    register_once(props: Properties, default_value: any, days?: number): boolean;
    /**
     * @param {Object} props
     * @param {number=} days
     */
    register(props: Properties, days?: number): boolean;
    unregister(prop: string): void;
    update_campaign_params(): void;
    update_search_keyword(): void;
    update_referrer_info(): void;
    get_referrer_info(): Properties;
    safe_merge(props: Properties): Properties;
    update_config(config: PostHogConfig): void;
    set_disabled(disabled: boolean): void;
    set_cross_subdomain(cross_subdomain: boolean): void;
    get_cross_subdomain(): boolean;
    set_secure(secure: boolean): void;
    set_event_timer(event_name: string, timestamp: number): void;
    remove_event_timer(event_name: string): number;
    get_user_state(): 'anonymous' | 'identified';
    set_user_state(state: 'anonymous' | 'identified'): void;
    get_quota_limits(): Record<string, number>;
    set_quota_limits(state: Record<string, number>): void;
}

declare class PostHogFeatureFlags {
    instance: PostHog;
    _override_warning: boolean;
    featureFlagEventHandlers: FeatureFlagsCallback[];
    reloadFeatureFlagsQueued: boolean;
    reloadFeatureFlagsInAction: boolean;
    $anon_distinct_id: string | undefined;
    constructor(instance: PostHog);
    getFlags(): string[];
    getFlagVariants(): Record<string, string | boolean>;
    getFlagPayloads(): Record<string, JsonType>;
    /**
     * Reloads feature flags asynchronously.
     *
     * Constraints:
     *
     * 1. Avoid parallel requests
     * 2. Delay a few milliseconds after each reloadFeatureFlags call to batch subsequent changes together
     * 3. Don't call this during initial load (as /decide will be called instead), see posthog-core.js
     */
    reloadFeatureFlags(): void;
    setAnonymousDistinctId(anon_distinct_id: string): void;
    setReloadingPaused(isPaused: boolean): void;
    resetRequestQueue(): void;
    _startReloadTimer(): void;
    _reloadFeatureFlagsRequest(): void;
    getFeatureFlag(key: string, options?: {
        send_event?: boolean;
    }): boolean | string | undefined;
    getFeatureFlagPayload(key: string): JsonType;
    isFeatureEnabled(key: string, options?: {
        send_event?: boolean;
    }): boolean | undefined;
    addFeatureFlagsHandler(handler: FeatureFlagsCallback): void;
    removeFeatureFlagsHandler(handler: FeatureFlagsCallback): void;
    receivedFeatureFlags(response: Partial<DecideResponse>): void;
    override(flags: boolean | string[] | Record<string, string | boolean>): void;
    onFeatureFlags(callback: FeatureFlagsCallback): () => void;
    updateEarlyAccessFeatureEnrollment(key: string, isEnrolled: boolean): void;
    getEarlyAccessFeatures(callback: EarlyAccessFeatureCallback, force_reload?: boolean): void;
    _prepareFeatureFlagsForCallbacks(): {
        flags: string[];
        flagVariants: Record<string, string | boolean>;
    };
    _fireFeatureFlagsCallbacks(): void;
    /**
     * Set override person properties for feature flags.
     * This is used when dealing with new persons / where you don't want to wait for ingestion
     * to update user properties.
     */
    setPersonPropertiesForFlags(properties: Properties, reloadFeatureFlags?: boolean): void;
    resetPersonPropertiesForFlags(): void;
    /**
     * Set override group properties for feature flags.
     * This is used when dealing with new groups / where you don't want to wait for ingestion
     * to update properties.
     * Takes in an object, the key of which is the group type.
     * For example:
     *     setGroupPropertiesForFlags({'organization': { name: 'CYZ', employees: '11' } })
     */
    setGroupPropertiesForFlags(properties: {
        [type: string]: Properties;
    }, reloadFeatureFlags?: boolean): void;
    resetGroupPropertiesForFlags(group_type?: string): void;
}

declare enum EventType {
    DomContentLoaded = 0,
    Load = 1,
    FullSnapshot = 2,
    IncrementalSnapshot = 3,
    Meta = 4,
    Custom = 5,
    Plugin = 6
}
type domContentLoadedEvent = {
    type: EventType.DomContentLoaded;
    data: unknown;
};
type loadedEvent = {
    type: EventType.Load;
    data: unknown;
};
type fullSnapshotEvent = {
    type: EventType.FullSnapshot;
    data: {
        node: serializedNodeWithId;
        initialOffset: {
            top: number;
            left: number;
        };
    };
};
type incrementalSnapshotEvent = {
    type: EventType.IncrementalSnapshot;
    data: incrementalData;
};
type metaEvent = {
    type: EventType.Meta;
    data: {
        href: string;
        width: number;
        height: number;
    };
};
type customEvent<T = unknown> = {
    type: EventType.Custom;
    data: {
        tag: string;
        payload: T;
    };
};
type pluginEvent<T = unknown> = {
    type: EventType.Plugin;
    data: {
        plugin: string;
        payload: T;
    };
};
declare enum IncrementalSource {
    Mutation = 0,
    MouseMove = 1,
    MouseInteraction = 2,
    Scroll = 3,
    ViewportResize = 4,
    Input = 5,
    TouchMove = 6,
    MediaInteraction = 7,
    StyleSheetRule = 8,
    CanvasMutation = 9,
    Font = 10,
    Log = 11,
    Drag = 12,
    StyleDeclaration = 13,
    Selection = 14,
    AdoptedStyleSheet = 15
}
type mutationData = {
    source: IncrementalSource.Mutation;
} & mutationCallbackParam;
type mousemoveData = {
    source: IncrementalSource.MouseMove | IncrementalSource.TouchMove | IncrementalSource.Drag;
    positions: mousePosition[];
};
type mouseInteractionData = {
    source: IncrementalSource.MouseInteraction;
} & mouseInteractionParam;
type scrollData = {
    source: IncrementalSource.Scroll;
} & scrollPosition;
type viewportResizeData = {
    source: IncrementalSource.ViewportResize;
} & viewportResizeDimension;
type inputData = {
    source: IncrementalSource.Input;
    id: number;
} & inputValue;
type mediaInteractionData = {
    source: IncrementalSource.MediaInteraction;
} & mediaInteractionParam;
type styleSheetRuleData = {
    source: IncrementalSource.StyleSheetRule;
} & styleSheetRuleParam;
type styleDeclarationData = {
    source: IncrementalSource.StyleDeclaration;
} & styleDeclarationParam;
type canvasMutationData = {
    source: IncrementalSource.CanvasMutation;
} & canvasMutationParam;
type fontData = {
    source: IncrementalSource.Font;
} & fontParam;
type selectionData = {
    source: IncrementalSource.Selection;
} & selectionParam;
type adoptedStyleSheetData = {
    source: IncrementalSource.AdoptedStyleSheet;
} & adoptedStyleSheetParam;
type incrementalData = mutationData | mousemoveData | mouseInteractionData | scrollData | viewportResizeData | inputData | mediaInteractionData | styleSheetRuleData | canvasMutationData | fontData | selectionData | styleDeclarationData | adoptedStyleSheetData;
type event = domContentLoadedEvent | loadedEvent | fullSnapshotEvent | incrementalSnapshotEvent | metaEvent | customEvent | pluginEvent;
type eventWithTime = event & {
    timestamp: number;
    delay?: number;
};
type textMutation = {
    id: number;
    value: string | null;
};
type styleOMValue = {
    [key: string]: styleValueWithPriority | string | false;
};
type styleValueWithPriority = [string, string];
type attributeMutation = {
    id: number;
    attributes: {
        [key: string]: string | styleOMValue | null;
    };
};
type removedNodeMutation = {
    parentId: number;
    id: number;
    isShadow?: boolean;
};
type addedNodeMutation = {
    parentId: number;
    previousId?: number | null;
    nextId: number | null;
    node: serializedNodeWithId;
};
type mutationCallbackParam = {
    texts: textMutation[];
    attributes: attributeMutation[];
    removes: removedNodeMutation[];
    adds: addedNodeMutation[];
    isAttachIframe?: true;
};
type mousePosition = {
    x: number;
    y: number;
    id: number;
    timeOffset: number;
};
declare enum MouseInteractions {
    MouseUp = 0,
    MouseDown = 1,
    Click = 2,
    ContextMenu = 3,
    DblClick = 4,
    Focus = 5,
    Blur = 6,
    TouchStart = 7,
    TouchMove_Departed = 8,
    TouchEnd = 9,
    TouchCancel = 10
}
declare enum PointerTypes {
    Mouse = 0,
    Pen = 1,
    Touch = 2
}
declare enum CanvasContext {
    '2D' = 0,
    WebGL = 1,
    WebGL2 = 2
}
type mouseInteractionParam = {
    type: MouseInteractions;
    id: number;
    x: number;
    y: number;
    pointerType?: PointerTypes;
};
type scrollPosition = {
    id: number;
    x: number;
    y: number;
};
type styleSheetAddRule = {
    rule: string;
    index?: number | number[];
};
type styleSheetDeleteRule = {
    index: number | number[];
};
type styleSheetRuleParam = {
    id?: number;
    styleId?: number;
    removes?: styleSheetDeleteRule[];
    adds?: styleSheetAddRule[];
    replace?: string;
    replaceSync?: string;
};
type adoptedStyleSheetParam = {
    id: number;
    styles?: {
        styleId: number;
        rules: styleSheetAddRule[];
    }[];
    styleIds: number[];
};
type styleDeclarationParam = {
    id?: number;
    styleId?: number;
    index: number[];
    set?: {
        property: string;
        value: string | null;
        priority: string | undefined;
    };
    remove?: {
        property: string;
    };
};
type canvasMutationCommand = {
    property: string;
    args: Array<unknown>;
    setter?: true;
};
type canvasMutationParam = {
    id: number;
    type: CanvasContext;
    commands: canvasMutationCommand[];
} | ({
    id: number;
    type: CanvasContext;
} & canvasMutationCommand);
type fontParam = {
    family: string;
    fontSource: string;
    buffer: boolean;
    descriptors?: FontFaceDescriptors;
};
type viewportResizeDimension = {
    width: number;
    height: number;
};
type inputValue = {
    text: string;
    isChecked: boolean;
    userTriggered?: boolean;
};
declare const enum MediaInteractions {
    Play = 0,
    Pause = 1,
    Seeked = 2,
    VolumeChange = 3,
    RateChange = 4
}
type mediaInteractionParam = {
    type: MediaInteractions;
    id: number;
    currentTime?: number;
    volume?: number;
    muted?: boolean;
    playbackRate?: number;
};
type SelectionRange = {
    start: number;
    startOffset: number;
    end: number;
    endOffset: number;
};
type selectionParam = {
    ranges: Array<SelectionRange>;
};
declare global {
    interface Window {
        FontFace: typeof FontFace;
    }
}

declare class SessionRecording {
    private instance;
    private _endpoint;
    private flushBufferTimer?;
    private buffer?;
    private mutationRateLimiter?;
    private _captureStarted;
    private stopRrweb;
    private receivedDecide;
    private rrwebRecord;
    private isIdle;
    private _linkedFlagSeen;
    private _lastActivityTimestamp;
    private windowId;
    private sessionId;
    private _linkedFlag;
    private _sampleRate;
    private _minimumDuration;
    _forceAllowLocalhostNetworkCapture: boolean;
    get started(): boolean;
    private get sessionManager();
    private get isSampled();
    private get sessionDuration();
    private get isRecordingEnabled();
    private get isConsoleLogCaptureEnabled();
    private get recordingVersion();
    private get networkPayloadCapture();
    /**
     * defaults to buffering mode until a decide response is received
     * once a decide response is received status can be disabled, active or sampled
     */
    private get status();
    constructor(instance: PostHog);
    startRecordingIfEnabled(): void;
    stopRecording(): void;
    private makeSamplingDecision;
    afterDecideResponse(response: DecideResponse): void;
    log(message: string, level?: 'log' | 'warn' | 'error'): void;
    private startCaptureAndTrySendingQueuedSnapshots;
    private _startCapture;
    private _isInteractiveEvent;
    private _updateWindowAndSessionIds;
    private _tryRRwebMethod;
    private _tryAddCustomEvent;
    private _tryTakeFullSnapshot;
    private _onScriptLoaded;
    private _gatherRRWebPlugins;
    onRRwebEmit(rawEvent: eventWithTime): void;
    private _maskUrl;
    private clearBuffer;
    private _flushBuffer;
    private _captureSnapshotBuffered;
    private _captureSnapshot;
}

declare class Toolbar {
    instance: PostHog;
    constructor(instance: PostHog);
    afterDecideResponse(response: DecideResponse): void;
    /**
     * To load the toolbar, we need an access token and other state. That state comes from one of three places:
     * 1. In the URL hash params
     * 2. From session storage under the key `toolbarParams` if the toolbar was initialized on a previous page
     */
    maybeLoadToolbar(location?: Location | undefined, localStorage?: Storage | undefined, history?: History | undefined): boolean;
    loadToolbar(params?: ToolbarParams): boolean;
    /** @deprecated Use "loadToolbar" instead. */
    _loadEditor(params: ToolbarParams): boolean;
    /** @deprecated Use "maybeLoadToolbar" instead. */
    maybeLoadEditor(location?: Location | undefined, localStorage?: Storage | undefined, history?: History | undefined): boolean;
}

declare class RequestQueue extends RequestQueueScaffold {
    handlePollRequest: (url: string, data: Properties, options?: XHROptions) => void;
    constructor(handlePollRequest: (url: string, data: Properties, options?: XHROptions) => void, pollInterval?: number);
    enqueue(url: string, data: Properties, options: XHROptions): void;
    poll(): void;
    unload(): void;
    formatQueue(): Record<string, QueuedRequestData>;
}

declare class SessionIdManager {
    private readonly _sessionIdGenerator;
    private readonly _windowIdGenerator;
    private config;
    private persistence;
    private _windowId;
    private _sessionId;
    private readonly _window_id_storage_key;
    private readonly _primary_window_exists_storage_key;
    private _sessionStartTimestamp;
    private _sessionActivityTimestamp;
    private readonly _sessionTimeoutMs;
    private _sessionIdChangedHandlers;
    constructor(config: Partial<PostHogConfig>, persistence: PostHogPersistence, sessionIdGenerator?: () => string, windowIdGenerator?: () => string);
    onSessionId(callback: SessionIdChangedCallback): () => void;
    private _canUseSessionStorage;
    private _setWindowId;
    private _getWindowId;
    private _setSessionId;
    private _getSessionId;
    resetSessionId(): void;
    private _listenToReloadWindow;
    checkAndGetSessionAndWindowId(readOnly?: boolean, _timestamp?: number | null): {
        sessionId: string;
        windowId: string;
        sessionStartTimestamp: number;
    };
}

/**
 * Integrate Sentry with PostHog. This will add a direct link to the person in Sentry, and an $exception event in PostHog
 *
 * ### Usage
 *
 *     Sentry.init({
 *          dsn: 'https://example',
 *          integrations: [
 *              new posthog.SentryIntegration(posthog)
 *          ]
 *     })
 *
 * @param {Object} [posthog] The posthog object
 * @param {string} [organization] Optional: The Sentry organization, used to send a direct link from PostHog to Sentry
 * @param {Number} [projectId] Optional: The Sentry project id, used to send a direct link from PostHog to Sentry
 * @param {string} [prefix] Optional: Url of a self-hosted sentry instance (default: https://sentry.io/organizations/)
 */

declare type _SentryEventProcessor = any;
declare type _SentryHub = any;
interface _SentryIntegration {
    name: string;
    setupOnce(addGlobalEventProcessor: (callback: _SentryEventProcessor) => void, getCurrentHub: () => _SentryHub): void;
}
declare class SentryIntegration implements _SentryIntegration {
    name: string;
    setupOnce: (addGlobalEventProcessor: (callback: _SentryEventProcessor) => void, getCurrentHub: () => _SentryHub) => void;
    constructor(_posthog: PostHog, organization?: string, projectId?: number, prefix?: string);
}

interface PageViewData {
    pathname: string;
    maxScrollHeight?: number;
    maxScrollY?: number;
    lastScrollY?: number;
    maxContentHeight?: number;
    maxContentY?: number;
    lastContentY?: number;
}
interface ScrollProperties {
    $prev_pageview_last_scroll?: number;
    $prev_pageview_last_scroll_percentage?: number;
    $prev_pageview_max_scroll?: number;
    $prev_pageview_max_scroll_percentage?: number;
    $prev_pageview_last_content?: number;
    $prev_pageview_last_content_percentage?: number;
    $prev_pageview_max_content?: number;
    $prev_pageview_max_content_percentage?: number;
}
interface PageViewEventProperties extends ScrollProperties {
    $prev_pageview_pathname?: string;
}
declare class PageViewManager {
    _pageViewData: PageViewData | undefined;
    _hasSeenPageView: boolean;
    _createPageViewData(): PageViewData;
    doPageView(): PageViewEventProperties;
    doPageLeave(): PageViewEventProperties;
    _calculatePrevPageScrollProperties(prevPageViewData: PageViewData | undefined): ScrollProperties;
    _updateScrollData: () => void;
    startMeasuringScrollPosition(): void;
    stopMeasuringScrollPosition(): void;
    _scrollHeight(): number;
    _scrollY(): number;
    _contentHeight(): number;
    _contentY(): number;
}

/**
 * Having Survey types in types.ts was confusing tsc
 * and generating an invalid module.d.ts
 * See https://github.com/PostHog/posthog-js/issues/698
 */
interface SurveyAppearance {
    backgroundColor?: string;
    submitButtonColor?: string;
    textColor?: string;
    submitButtonText?: string;
    descriptionTextColor?: string;
    ratingButtonColor?: string;
    ratingButtonActiveColor?: string;
    ratingButtonHoverColor?: string;
    whiteLabel?: boolean;
    autoDisappear?: boolean;
    displayThankYouMessage?: boolean;
    thankYouMessageHeader?: string;
    thankYouMessageDescription?: string;
    borderColor?: string;
    position?: 'left' | 'right' | 'center';
    placeholder?: string;
    widgetType?: 'button' | 'tab' | 'selector';
    widgetSelector?: string;
    widgetLabel?: string;
    widgetColor?: string;
    maxWidth?: string;
    zIndex?: string;
}
declare enum SurveyType {
    Popover = "popover",
    API = "api",
    Widget = "widget"
}
declare type SurveyQuestion = BasicSurveyQuestion | LinkSurveyQuestion | RatingSurveyQuestion | MultipleSurveyQuestion;
interface SurveyQuestionBase {
    question: string;
    description?: string | null;
    optional?: boolean;
    buttonText?: string;
}
interface BasicSurveyQuestion extends SurveyQuestionBase {
    type: SurveyQuestionType.Open;
}
interface LinkSurveyQuestion extends SurveyQuestionBase {
    type: SurveyQuestionType.Link;
    link: string | null;
}
interface RatingSurveyQuestion extends SurveyQuestionBase {
    type: SurveyQuestionType.Rating;
    display: 'number' | 'emoji';
    scale: number;
    lowerBoundLabel: string;
    upperBoundLabel: string;
}
interface MultipleSurveyQuestion extends SurveyQuestionBase {
    type: SurveyQuestionType.SingleChoice | SurveyQuestionType.MultipleChoice;
    choices: string[];
    hasOpenChoice?: boolean;
}
declare enum SurveyQuestionType {
    Open = "open",
    MultipleChoice = "multiple_choice",
    SingleChoice = "single_choice",
    Rating = "rating",
    Link = "link"
}
interface SurveyResponse {
    surveys: Survey[];
}
declare type SurveyCallback = (surveys: Survey[]) => void;
declare type SurveyUrlMatchType = 'regex' | 'exact' | 'icontains';
interface Survey {
    id: string;
    name: string;
    description: string;
    type: SurveyType;
    linked_flag_key: string | null;
    targeting_flag_key: string | null;
    questions: SurveyQuestion[];
    appearance: SurveyAppearance | null;
    conditions: {
        url?: string;
        selector?: string;
        seenSurveyWaitPeriodInDays?: number;
        urlMatchType?: SurveyUrlMatchType;
    } | null;
    start_date: string | null;
    end_date: string | null;
}

declare class PostHogSurveys {
    instance: PostHog;
    constructor(instance: PostHog);
    getSurveys(callback: SurveyCallback, forceReload?: boolean): void;
    getActiveMatchingSurveys(callback: SurveyCallback, forceReload?: boolean): void;
}

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
declare class SessionPropsManager {
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

declare class DeprecatedWebPerformanceObserver {
    get _forceAllowLocalhost(): boolean;
    set _forceAllowLocalhost(value: boolean);
    private __forceAllowLocalhost;
}
/**
 * PostHog Library Object
 * @constructor
 */
declare class PostHog {
    __loaded: boolean;
    __loaded_recorder_version: 'v1' | 'v2' | undefined;
    config: PostHogConfig;
    rateLimiter: RateLimiter;
    pageViewManager: PageViewManager;
    featureFlags: PostHogFeatureFlags;
    surveys: PostHogSurveys;
    toolbar: Toolbar;
    persistence?: PostHogPersistence;
    sessionPersistence?: PostHogPersistence;
    sessionManager?: SessionIdManager;
    sessionPropsManager?: SessionPropsManager;
    _requestQueue?: RequestQueue;
    _retryQueue?: RetryQueue;
    sessionRecording?: SessionRecording;
    webPerformance: DeprecatedWebPerformanceObserver;
    _triggered_notifs: any;
    compression: Partial<Record<Compression, boolean>>;
    _jsc: JSC;
    __captureHooks: ((eventName: string) => void)[];
    __request_queue: [url: string, data: Record<string, any>, options: XHROptions, callback?: RequestCallback][];
    __autocapture: boolean | AutocaptureConfig | undefined;
    decideEndpointWasHit: boolean;
    analyticsDefaultEndpoint: string;
    elementsChainAsString: boolean;
    SentryIntegration: typeof SentryIntegration;
    segmentIntegration: () => any;
    /** DEPRECATED: We keep this to support existing usage but now one should just call .setPersonProperties */
    people: {
        set: (prop: string | Properties, to?: string, callback?: RequestCallback) => void;
        set_once: (prop: string | Properties, to?: string, callback?: RequestCallback) => void;
    };
    constructor();
    /**
     * This function initializes a new instance of the PostHog capturing object.
     * All new instances are added to the main posthog object as sub properties (such as
     * posthog.library_name) and also returned by this function. To define a
     * second instance on the page, you would call:
     *
     *     posthog.init('new token', { your: 'config' }, 'library_name');
     *
     * and use it like so:
     *
     *     posthog.library_name.capture(...);
     *
     * @param {String} token   Your PostHog API token
     * @param {Object} [config]  A dictionary of config options to override. <a href="https://github.com/posthog/posthog-js/blob/6e0e873/src/posthog-core.js#L57-L91">See a list of default config options</a>.
     * @param {String} [name]    The name for the new posthog instance that you want created
     */
    init(token: string, config?: Partial<PostHogConfig>, name?: string): PostHog | void;
    _init(token: string, config?: Partial<PostHogConfig>, name?: string, initComplete?: (instance: PostHog) => void): void;
    _afterDecideResponse(response: DecideResponse): void;
    _loaded(): void;
    _start_queue_if_opted_in(): void;
    _dom_loaded(): void;
    /**
     * _prepare_callback() should be called by callers of _send_request for use
     * as the callback argument.
     *
     * If there is no callback, this returns null.
     * If we are going to make XHR/XDR requests, this returns a function.
     * If we are going to use script tags, this returns a string to use as the
     * callback GET param.
     */
    _prepare_callback(callback?: RequestCallback, data?: Properties): RequestCallback | null | string;
    _handle_unload(): void;
    _handle_queued_event(url: string, data: Record<string, any>, options?: XHROptions): void;
    __compress_and_send_json_request(url: string, jsonData: string, options: XHROptions, callback?: RequestCallback): void;
    _send_request(url: string, data: Record<string, any>, options: CaptureOptions, callback?: RequestCallback): void;
    /**
     * _execute_array() deals with processing any posthog function
     * calls that were called before the PostHog library were loaded
     * (and are thus stored in an array so they can be called later)
     *
     * Note: we fire off all the posthog function calls && user defined
     * functions BEFORE we fire off posthog capturing calls. This is so
     * identify/register/set_config calls can properly modify early
     * capturing calls.
     *
     * @param {Array} array
     */
    _execute_array(array: SnippetArrayItem[]): void;
    _hasBootstrappedFeatureFlags(): boolean;
    /**
     * push() keeps the standard async-array-push
     * behavior around after the lib is loaded.
     * This is only useful for external integrations that
     * do not wish to rely on our convenience methods
     * (created in the snippet).
     *
     * ### Usage:
     *     posthog.push(['register', { a: 'b' }]);
     *
     * @param {Array} item A [function_name, args...] array to be executed
     */
    push(item: SnippetArrayItem): void;
    /**
     * Capture an event. This is the most important and
     * frequently used PostHog function.
     *
     * ### Usage:
     *
     *     // capture an event named 'Registered'
     *     posthog.capture('Registered', {'Gender': 'Male', 'Age': 21});
     *
     *     // capture an event using navigator.sendBeacon
     *     posthog.capture('Left page', {'duration_seconds': 35}, {transport: 'sendBeacon'});
     *
     * @param {String} event_name The name of the event. This can be anything the user does - 'Button Click', 'Sign Up', 'Item Purchased', etc.
     * @param {Object} [properties] A set of properties to include with the event you're sending. These describe the user who did the event or details about the event itself.
     * @param {Object} [options] Optional configuration for this capture request.
     * @param {String} [options.transport] Transport method for network request ('XHR' or 'sendBeacon').
     * @param {Date} [options.timestamp] Timestamp is a Date object. If not set, it'll automatically be set to the current time.
     */
    capture(event_name: string, properties?: Properties | null, options?: CaptureOptions): CaptureResult | void;
    _addCaptureHook(callback: (eventName: string) => void): void;
    _invokeCaptureHooks(eventName: string, eventData: CaptureResult): void;
    _calculate_event_properties(event_name: string, event_properties: Properties): Properties;
    /**
     * Register a set of super properties, which are included with all
     * events. This will overwrite previous super property values, except
     * for session properties (see `register_for_session(properties)`).
     *
     * ### Usage:
     *
     *     // register 'Gender' as a super property
     *     posthog.register({'Gender': 'Female'});
     *
     *     // register several super properties when a user signs up
     *     posthog.register({
     *         'Email': 'jdoe@example.com',
     *         'Account Type': 'Free'
     *     });
     *
     *     // Display the properties
     *     console.log(posthog.persistence.properties())
     *
     * @param {Object} properties An associative array of properties to store about the user
     * @param {Number} [days] How many days since the user's last visit to store the super properties
     */
    register(properties: Properties, days?: number): void;
    /**
     * Register a set of super properties only once. These will not
     * overwrite previous super property values, unlike register().
     *
     * ### Usage:
     *
     *     // register a super property for the first time only
     *     posthog.register_once({
     *         'First Login Date': new Date().toISOString()
     *     });
     *
     *     // Display the properties
     *     console.log(posthog.persistence.properties())
     *
     * ### Notes:
     *
     * If default_value is specified, current super properties
     * with that value will be overwritten.
     *
     * @param {Object} properties An associative array of properties to store about the user
     * @param {*} [default_value] Value to override if already set in super properties (ex: 'False') Default: 'None'
     * @param {Number} [days] How many days since the users last visit to store the super properties
     */
    register_once(properties: Properties, default_value?: Property, days?: number): void;
    /**
     * Register a set of super properties, which are included with all events, but only
     * for THIS SESSION. These will overwrite all other super property values.
     *
     * Unlike regular super properties, which last in LocalStorage for a long time,
     * session super properties get cleared after a session ends.
     *
     * ### Usage:
     *
     *     // register on all events this session
     *     posthog.register_for_session({'referer': customGetReferer()});
     *
     *     // register several session super properties when a user signs up
     *     posthog.register_for_session({
     *         'selectedPlan': 'pro',
     *         'completedSteps': 4,
     *     });
     *
     *     // Display the properties
     *     console.log(posthog.sessionPersistence.properties())
     *
     * @param {Object} properties An associative array of properties to store about the user
     */
    register_for_session(properties: Properties): void;
    /**
     * Delete a super property stored with the current user.
     *
     * @param {String} property The name of the super property to remove
     */
    unregister(property: string): void;
    /**
     * Delete a session super property stored with the current user.
     *
     * @param {String} property The name of the session super property to remove
     */
    unregister_for_session(property: string): void;
    _register_single(prop: string, value: Property): void;
    getFeatureFlag(key: string, options?: {
        send_event?: boolean;
    }): boolean | string | undefined;
    getFeatureFlagPayload(key: string): JsonType;
    isFeatureEnabled(key: string, options?: isFeatureEnabledOptions): boolean | undefined;
    reloadFeatureFlags(): void;
    /** Opt the user in or out of an early access feature. */
    updateEarlyAccessFeatureEnrollment(key: string, isEnrolled: boolean): void;
    /** Get the list of early access features. To check enrollment status, use `isFeatureEnabled`. */
    getEarlyAccessFeatures(callback: EarlyAccessFeatureCallback, force_reload?: boolean): void;
    onFeatureFlags(callback: (flags: string[], variants: Record<string, string | boolean>) => void): () => void;
    onSessionId(callback: SessionIdChangedCallback): () => void;
    /** Get list of all surveys. */
    getSurveys(callback: SurveyCallback, forceReload?: boolean): void;
    /** Get surveys that should be enabled for the current user. */
    getActiveMatchingSurveys(callback: SurveyCallback, forceReload?: boolean): void;
    /**
     * Identify a user with a unique ID instead of a PostHog
     * randomly generated distinct_id. If the method is never called,
     * then unique visitors will be identified by a UUID that is generated
     * the first time they visit the site.
     *
     * If user properties are passed, they are also sent to posthog.
     *
     * ### Usage:
     *
     *      posthog.identify('[user unique id]')
     *      posthog.identify('[user unique id]', { email: 'john@example.com' })
     *      posthog.identify('[user unique id]', {}, { referral_code: '12345' })
     *
     * ### Notes:
     *
     * You can call this function to overwrite a previously set
     * unique ID for the current user.
     *
     * If the user has been identified ($user_state in persistence is set to 'identified'),
     * then capture of $identify is skipped to avoid merging users. For example,
     * if your system allows an admin user to impersonate another user.
     *
     * Then a single browser instance can have:
     *
     *  `identify('a') -> capture(1) -> identify('b') -> capture(2)`
     *
     * and capture 1 and capture 2 will have the correct distinct_id.
     * but users a and b will NOT be merged in posthog.
     *
     * However, if reset is called then:
     *
     *  `identify('a') -> capture(1) -> reset() -> capture(2) -> identify('b') -> capture(3)`
     *
     * users a and b are not merged.
     * Capture 1 is associated with user a.
     * A new distinct id is generated for capture 2.
     * which is merged with user b.
     * So, capture 2 and 3 are associated with user b.
     *
     * If you want to merge two identified users, you can call posthog.alias
     *
     * @param {String} [new_distinct_id] A string that uniquely identifies a user. If not provided, the distinct_id currently in the persistent store (cookie or localStorage) will be used.
     * @param {Object} [userPropertiesToSet] Optional: An associative array of properties to store about the user
     * @param {Object} [userPropertiesToSetOnce] Optional: An associative array of properties to store about the user. If property is previously set, this does not override that value.
     */
    identify(new_distinct_id?: string, userPropertiesToSet?: Properties, userPropertiesToSetOnce?: Properties): void;
    /**
     * Sets properties for the Person associated with the current distinct_id.
     *
     *
     * @param {Object} [userPropertiesToSet] Optional: An associative array of properties to store about the user
     * @param {Object} [userPropertiesToSetOnce] Optional: An associative array of properties to store about the user. If property is previously set, this does not override that value.
     */
    setPersonProperties(userPropertiesToSet?: Properties, userPropertiesToSetOnce?: Properties): void;
    /**
     * Alpha feature: don't use unless you know what you're doing!
     *
     * Sets group analytics information for subsequent events and reloads feature flags.
     *
     * @param {String} groupType Group type (example: 'organization')
     * @param {String} groupKey Group key (example: 'org::5')
     * @param {Object} groupPropertiesToSet Optional properties to set for group
     */
    group(groupType: string, groupKey: string, groupPropertiesToSet?: Properties): void;
    /**
     * Resets only the group properties of the user currently logged in.
     */
    resetGroups(): void;
    /**
     * Set override person properties for feature flags.
     * This is used when dealing with new persons / where you don't want to wait for ingestion
     * to update user properties.
     */
    setPersonPropertiesForFlags(properties: Properties, reloadFeatureFlags?: boolean): void;
    resetPersonPropertiesForFlags(): void;
    /**
     * Set override group properties for feature flags.
     * This is used when dealing with new groups / where you don't want to wait for ingestion
     * to update properties.
     * Takes in an object, the key of which is the group type.
     * For example:
     *     setGroupPropertiesForFlags({'organization': { name: 'CYZ', employees: '11' } })
     */
    setGroupPropertiesForFlags(properties: {
        [type: string]: Properties;
    }, reloadFeatureFlags?: boolean): void;
    resetGroupPropertiesForFlags(group_type?: string): void;
    /**
     * Clears super properties and generates a new random distinct_id for this instance.
     * Useful for clearing data when a user logs out.
     */
    reset(reset_device_id?: boolean): void;
    /**
     * Returns the current distinct id of the user. This is either the id automatically
     * generated by the library or the id that has been passed by a call to identify().
     *
     * ### Notes:
     *
     * get_distinct_id() can only be called after the PostHog library has finished loading.
     * init() has a loaded function available to handle this automatically. For example:
     *
     *     // set distinct_id after the posthog library has loaded
     *     posthog.init('YOUR PROJECT TOKEN', {
     *         loaded: function(posthog) {
     *             distinct_id = posthog.get_distinct_id();
     *         }
     *     });
     */
    get_distinct_id(): string;
    getGroups(): Record<string, any>;
    /**
     * Returns the current session_id.
     *
     * NOTE: This should only be used for informative purposes.
     * Any actual internal use case for the session_id should be handled by the sessionManager.
     */
    get_session_id(): string;
    /**
     * Returns the Replay url for the current session.
     *
     * @param options Options for the url
     * @param options.withTimestamp Whether to include the timestamp in the url (defaults to false)
     * @param options.timestampLookBack How many seconds to look back for the timestamp (defaults to 10)
     */
    get_session_replay_url(options?: {
        withTimestamp?: boolean;
        timestampLookBack?: number;
    }): string;
    /**
     * Create an alias, which PostHog will use to link two distinct_ids going forward (not retroactively).
     * Multiple aliases can map to the same original ID, but not vice-versa. Aliases can also be chained - the
     * following is a valid scenario:
     *
     *     posthog.alias('new_id', 'existing_id');
     *     ...
     *     posthog.alias('newer_id', 'new_id');
     *
     * If the original ID is not passed in, we will use the current distinct_id - probably the auto-generated GUID.
     *
     * ### Notes:
     *
     * The best practice is to call alias() when a unique ID is first created for a user
     * (e.g., when a user first registers for an account and provides an email address).
     * alias() should never be called more than once for a given user, except to
     * chain a newer ID to a previously new ID, as described above.
     *
     * @param {String} alias A unique identifier that you want to use for this user in the future.
     * @param {String} [original] The current identifier being used for this user.
     */
    alias(alias: string, original?: string): CaptureResult | void | number;
    /**
     * Update the configuration of a posthog library instance.
     *
     * The default config is:
     *
     *     {
     *       // PostHog API host
     *       api_host: 'https://app.posthog.com',
     *
     *       // HTTP method for capturing requests
     *       api_method: 'POST'
     *
     *       // PostHog web app host, currently only used by the Sentry integration.
     *       // This will only be different from api_host when using a reverse-proxied API host – in that case
     *       // the original web app host needs to be passed here so that links to the web app are still convenient.
     *       ui_host: 'https://app.posthog.com',
     *
     *       // Automatically capture clicks, form submissions and change events
     *       autocapture: true
     *
     *       // Capture rage clicks
     *       rageclick: true
     *
     *       // transport for sending requests ('XHR' or 'sendBeacon')
     *       // NB: sendBeacon should only be used for scenarios such as
     *       // page unload where a "best-effort" attempt to send is
     *       // acceptable; the sendBeacon API does not support callbacks
     *       // or any way to know the result of the request. PostHog
     *       // capturing via sendBeacon will not support any event-
     *       // batching or retry mechanisms.
     *       api_transport: 'XHR'
     *
     *       // super properties cookie expiration (in days)
     *       cookie_expiration: 365
     *
     *       // super properties span subdomains
     *       cross_subdomain_cookie: true
     *
     *       // debug mode
     *       debug: false
     *
     *       // if this is true, the posthog cookie or localStorage entry
     *       // will be deleted, and no user persistence will take place
     *       disable_persistence: false
     *
     *       // if this is true, PostHog will automatically determine
     *       // City, Region and Country data using the IP address of
     *       //the client
     *       ip: true
     *
     *       // opt users out of capturing by this PostHog instance by default
     *       opt_out_capturing_by_default: false
     *
     *       // opt users out of browser data storage by this PostHog instance by default
     *       opt_out_persistence_by_default: false
     *
     *       // persistence mechanism used by opt-in/opt-out methods - cookie
     *       // or localStorage - falls back to cookie if localStorage is unavailable
     *       opt_out_capturing_persistence_type: 'localStorage'
     *
     *       // customize the name of cookie/localStorage set by opt-in/opt-out methods
     *       opt_out_capturing_cookie_prefix: null
     *
     *       // type of persistent store for super properties (cookie/
     *       // localStorage) if set to 'localStorage', any existing
     *       // posthog cookie value with the same persistence_name
     *       // will be transferred to localStorage and deleted
     *       persistence: 'cookie'
     *
     *       // name for super properties persistent store
     *       persistence_name: ''
     *
     *       // names of properties/superproperties which should never
     *       // be sent with capture() calls
     *       property_blacklist: []
     *
     *       // if this is true, posthog cookies will be marked as
     *       // secure, meaning they will only be transmitted over https
     *       secure_cookie: false
     *
     *       // should we capture a page view on page load
     *       capture_pageview: true
     *
     *       // if you set upgrade to be true, the library will check for
     *       // a cookie from our old js library and import super
     *       // properties from it, then the old cookie is deleted
     *       // The upgrade config option only works in the initialization,
     *       // so make sure you set it when you create the library.
     *       upgrade: false
     *
     *       // if this is true, session recording is always disabled.
     *       disable_session_recording: false,
     *
     *       // extra HTTP request headers to set for each API request, in
     *       // the format {'Header-Name': value}
     *       xhr_headers: {}
     *
     *       // protocol for fetching in-app message resources, e.g.
     *       // 'https://' or 'http://'; defaults to '//' (which defers to the
     *       // current page's protocol)
     *       inapp_protocol: '//'
     *
     *       // whether to open in-app message link in new tab/window
     *       inapp_link_new_window: false
     *
     *      // a set of rrweb config options that PostHog users can configure
     *      // see https://github.com/rrweb-io/rrweb/blob/master/guide.md
     *      session_recording: {
     *         blockClass: 'ph-no-capture',
     *         blockSelector: null,
     *         ignoreClass: 'ph-ignore-input',
     *         maskAllInputs: true,
     *         maskInputOptions: {},
     *         maskInputFn: null,
     *         slimDOMOptions: {},
     *         collectFonts: false
     *      }
     *
     *      // prevent autocapture from capturing any attribute names on elements
     *      mask_all_element_attributes: false
     *
     *      // prevent autocapture from capturing textContent on all elements
     *      mask_all_text: false
     *
     *      // Anonymous users get a random UUID as their device by default.
     *      // This option allows overriding that option.
     *      get_device_id: (uuid) => uuid
     *     }
     *
     *
     * @param {Object} config A dictionary of new configuration values to update
     */
    set_config(config: Partial<PostHogConfig>): void;
    /**
     * turns session recording on, and updates the config option
     * disable_session_recording to false
     */
    startSessionRecording(): void;
    /**
     * turns session recording off, and updates the config option
     * disable_session_recording to true
     */
    stopSessionRecording(): void;
    /**
     * returns a boolean indicating whether session recording
     * is currently running
     */
    sessionRecordingStarted(): boolean;
    /**
     * returns a boolean indicating whether the toolbar loaded
     * @param toolbarParams
     */
    loadToolbar(params: ToolbarParams): boolean;
    /**
     * Returns the value of the super property named property_name. If no such
     * property is set, get_property() will return the undefined value.
     *
     * ### Notes:
     *
     * get_property() can only be called after the PostHog library has finished loading.
     * init() has a loaded function available to handle this automatically. For example:
     *
     *     // grab value for '$user_id' after the posthog library has loaded
     *     posthog.init('YOUR PROJECT TOKEN', {
     *         loaded: function(posthog) {
     *             user_id = posthog.get_property('$user_id');
     *         }
     *     });
     *
     * @param {String} property_name The name of the super property you want to retrieve
     */
    get_property(property_name: string): Property | undefined;
    /**
     * Returns the value of the session super property named property_name. If no such
     * property is set, getSessionProperty() will return the undefined value.
     *
     * ### Notes:
     *
     * This is based on browser-level `sessionStorage`, NOT the PostHog session.
     * getSessionProperty() can only be called after the PostHog library has finished loading.
     * init() has a loaded function available to handle this automatically. For example:
     *
     *     // grab value for 'user_id' after the posthog library has loaded
     *     posthog.init('YOUR PROJECT TOKEN', {
     *         loaded: function(posthog) {
     *             user_id = posthog.getSessionProperty('user_id');
     *         }
     *     });
     *
     * @param {String} property_name The name of the session super property you want to retrieve
     */
    getSessionProperty(property_name: string): Property | undefined;
    toString(): string;
    _gdpr_init(): void;
    /**
     * Enable or disable persistence based on options
     * only enable/disable if persistence is not already in this state
     * @param {boolean} [options.clear_persistence] If true, will delete all data stored by the sdk in persistence and disable it
     * @param {boolean} [options.enable_persistence] If true, will re-enable sdk persistence
     */
    _gdpr_update_persistence(options: Partial<OptInOutCapturingOptions>): void;
    _gdpr_call_func<R = any>(func: (token: string, options: GDPROptions) => R, options?: Partial<OptInOutCapturingOptions>): R;
    /**
     * Opt the user in to data capturing and cookies/localstorage for this PostHog instance
     *
     * ### Usage
     *
     *     // opt user in
     *     posthog.opt_in_capturing();
     *
     *     // opt user in with specific event name, properties, cookie configuration
     *     posthog.opt_in_capturing({
     *         capture_event_name: 'User opted in',
     *         capture_event_properties: {
     *             'Email': 'jdoe@example.com'
     *         },
     *         cookie_expiration: 30,
     *         secure_cookie: true
     *     });
     *
     * @param {Object} [options] A dictionary of config options to override
     * @param {function} [options.capture] Function used for capturing a PostHog event to record the opt-in action (default is this PostHog instance's capture method)
     * @param {string} [options.capture_event_name=$opt_in] Event name to be used for capturing the opt-in action
     * @param {Object} [options.capture_properties] Set of properties to be captured along with the opt-in action
     * @param {boolean} [options.enable_persistence=true] If true, will re-enable sdk persistence
     * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
     * @param {string} [options.cookie_prefix=__ph_opt_in_out] Custom prefix to be used in the cookie/localstorage name
     * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this PostHog instance's config)
     * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this PostHog instance's config)
     * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this PostHog instance's config)
     */
    opt_in_capturing(options?: Partial<OptInOutCapturingOptions>): void;
    /**
     * Opt the user out of data capturing and cookies/localstorage for this PostHog instance
     *
     * ### Usage
     *
     *     // opt user out
     *     posthog.opt_out_capturing();
     *
     *     // opt user out with different cookie configuration from PostHog instance
     *     posthog.opt_out_capturing({
     *         cookie_expiration: 30,
     *         secure_cookie: true
     *     });
     *
     * @param {Object} [options] A dictionary of config options to override
     * @param {boolean} [options.clear_persistence=true] If true, will delete all data stored by the sdk in persistence
     * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
     * @param {string} [options.cookie_prefix=__ph_opt_in_out] Custom prefix to be used in the cookie/localstorage name
     * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this PostHog instance's config)
     * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this PostHog instance's config)
     * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this PostHog instance's config)
     */
    opt_out_capturing(options?: Partial<OptInOutCapturingOptions>): void;
    /**
     * Check whether the user has opted in to data capturing and cookies/localstorage for this PostHog instance
     *
     * ### Usage
     *
     *     const has_opted_in = posthog.has_opted_in_capturing();
     *     // use has_opted_in value
     *
     * @param {Object} [options] A dictionary of config options to override
     * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
     * @param {string} [options.cookie_prefix=__ph_opt_in_out] Custom prefix to be used in the cookie/localstorage name
     * @returns {boolean} current opt-in status
     */
    has_opted_in_capturing(options?: Partial<OptInOutCapturingOptions>): boolean;
    /**
     * Check whether the user has opted out of data capturing and cookies/localstorage for this PostHog instance
     *
     * ### Usage
     *
     *     const has_opted_out = posthog.has_opted_out_capturing();
     *     // use has_opted_out value
     *
     * @param {Object} [options] A dictionary of config options to override
     * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
     * @param {string} [options.cookie_prefix=__ph_opt_in_out] Custom prefix to be used in the cookie/localstorage name
     * @returns {boolean} current opt-out status
     */
    has_opted_out_capturing(options?: Partial<OptInOutCapturingOptions>): boolean;
    /**
     * Clear the user's opt in/out status of data capturing and cookies/localstorage for this PostHog instance
     *
     * ### Usage
     *
     *     // clear user's opt-in/out status
     *     posthog.clear_opt_in_out_capturing();
     *
     *     // clear user's opt-in/out status with specific cookie configuration - should match
     *     // configuration used when opt_in_capturing/opt_out_capturing methods were called.
     *     posthog.clear_opt_in_out_capturing({
     *         cookie_expiration: 30,
     *         secure_cookie: true
     *     });
     *
     * @param {Object} [options] A dictionary of config options to override
     * @param {boolean} [options.enable_persistence=true] If true, will re-enable sdk persistence
     * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
     * @param {string} [options.cookie_prefix=__ph_opt_in_out] Custom prefix to be used in the cookie/localstorage name
     * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this PostHog instance's config)
     * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this PostHog instance's config)
     * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this PostHog instance's config)
     */
    clear_opt_in_out_capturing(options?: Partial<OptInOutCapturingOptions>): void;
    debug(debug?: boolean): void;
}

declare const posthog: PostHog;

export { AutoCaptureCustomProperty, AutocaptureCompatibleElement, AutocaptureConfig, BasicSurveyQuestion, Body, Breaker, CaptureCallback, CaptureOptions, CaptureResult, CapturedNetworkRequest, Compression, CompressionData, DecideResponse, DomAutocaptureEvents, EarlyAccessFeature, EarlyAccessFeatureCallback, EarlyAccessFeatureResponse, EventHandler, FeatureFlagsCallback, GDPROptions, Headers, InitiatorType, JSC, JsonType, LinkSurveyQuestion, MultipleSurveyQuestion, NetworkRecordOptions, NetworkRequest, OptInOutCapturingOptions, PersistentStore, PostData, PostHog, PostHogConfig, Properties, Property, QueuedRequestData, RatingSurveyQuestion, RequestCallback, RetryQueueElement, SessionIdChangedCallback, SessionRecordingOptions, SnippetArrayItem, Survey, SurveyAppearance, SurveyCallback, SurveyQuestion, SurveyQuestionType, SurveyResponse, SurveyType, SurveyUrlMatchType, ToolbarParams, ToolbarSource, ToolbarUserIntent, ToolbarVersion, UUIDVersion, XHROptions, XHRParams, posthog as default, isFeatureEnabledOptions, posthog };
