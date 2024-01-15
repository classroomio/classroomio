export function lightable(value) {
    function subscribe(run) {
        run(value);
        return () => {
            // don't need to unsub from anything
        };
    }
    return { subscribe };
}
