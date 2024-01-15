"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoreRule = exports.buildProxyListener = exports.getProxyNode = exports.defineWrapperListener = void 0;
const eslint_1 = require("eslint");
function defineWrapperListener(coreRule, context, proxyOptions) {
    const listener = coreRule.create(context);
    const svelteListener = proxyOptions.createListenerProxy?.(listener) ?? listener;
    return svelteListener;
}
exports.defineWrapperListener = defineWrapperListener;
function getProxyNode(node, properties) {
    const cache = {};
    return new Proxy(node, {
        get(_t, key) {
            if (key in cache) {
                return cache[key];
            }
            if (key in properties) {
                return (cache[key] = properties[key]);
            }
            return node[key];
        }
    });
}
exports.getProxyNode = getProxyNode;
function buildProxyListener(base, convertNode) {
    const listeners = {};
    for (const [key, listener] of Object.entries(base)) {
        listeners[key] = function (...args) {
            listener.call(this, ...args.map((arg) => {
                if (typeof arg === 'object' &&
                    'type' in arg &&
                    typeof arg.type === 'string' &&
                    'range' in arg) {
                    return convertNode(arg);
                }
                return arg;
            }));
        };
    }
    return listeners;
}
exports.buildProxyListener = buildProxyListener;
let ruleMap = null;
function getCoreRule(ruleName) {
    let map;
    if (ruleMap) {
        map = ruleMap;
    }
    else {
        ruleMap = map = new eslint_1.Linter().getRules();
    }
    return map.get(ruleName);
}
exports.getCoreRule = getCoreRule;
