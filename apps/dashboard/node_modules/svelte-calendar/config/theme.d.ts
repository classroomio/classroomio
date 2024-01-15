export namespace light {
    namespace calendar {
        const width: string;
        const maxWidth: string;
        namespace legend {
            const height: string;
        }
        const shadow: string;
        namespace colors {
            namespace text {
                const primary: string;
                const highlight: string;
            }
            namespace background {
                const primary_1: string;
                export { primary_1 as primary };
                const highlight_1: string;
                export { highlight_1 as highlight };
                export const hover: string;
            }
            const border: string;
        }
        namespace font {
            const regular: string;
            const large: string;
        }
        namespace grid {
            const disabledOpacity: string;
            const outsiderOpacity: string;
        }
    }
}
export namespace dark {
    export namespace calendar_1 {
        const width_1: string;
        export { width_1 as width };
        const maxWidth_1: string;
        export { maxWidth_1 as maxWidth };
        export namespace legend_1 {
            const height_1: string;
            export { height_1 as height };
        }
        export { legend_1 as legend };
        const shadow_1: string;
        export { shadow_1 as shadow };
        export namespace colors_1 {
            export namespace text_1 {
                const primary_2: string;
                export { primary_2 as primary };
                const highlight_2: string;
                export { highlight_2 as highlight };
            }
            export { text_1 as text };
            export namespace background_1 {
                const primary_3: string;
                export { primary_3 as primary };
                const highlight_3: string;
                export { highlight_3 as highlight };
                const hover_1: string;
                export { hover_1 as hover };
            }
            export { background_1 as background };
            const border_1: string;
            export { border_1 as border };
        }
        export { colors_1 as colors };
        export namespace font_1 {
            const regular_1: string;
            export { regular_1 as regular };
            const large_1: string;
            export { large_1 as large };
        }
        export { font_1 as font };
        export namespace grid_1 {
            const disabledOpacity_1: string;
            export { disabledOpacity_1 as disabledOpacity };
            const outsiderOpacity_1: string;
            export { outsiderOpacity_1 as outsiderOpacity };
        }
        export { grid_1 as grid };
    }
    export { calendar_1 as calendar };
}
