import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Spinner } from '@/feature/common/components/spinner';
import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useOpenLink } from '@/feature/lesson/helpers/open-external';
import { useServer } from '@/feature/server/components/server-provider';

function iframeDocument(src: string, background: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>html,body{margin:0;height:100%;background:${background};}iframe{position:fixed;inset:0;width:100%;height:100%;border:0;}</style>
</head><body><iframe src="${src.replace(/"/g, '&quot;')}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></body></html>`;
}

type EmbedFrameProps = {
  uri: string;
  title: string;
  /** Wraps the URL in an iframe page so providers that check the embedding origin (YouTube) see one. */
  framed?: boolean;
  aspectRatio?: number;
  /** Full width with no frame, for the video at the top of a lesson. */
  edgeToEdge?: boolean;
};

export function EmbedFrame({ uri, title, framed = false, aspectRatio = 16 / 9, edgeToEdge = false }: EmbedFrameProps) {
  const { colors } = useTheme();
  const { serverUrl } = useServer();
  const { openExternal } = useOpenLink();
  const [loading, setLoading] = useState(true);
  const host = (() => {
    try {
      return new URL(uri).host;
    } catch {
      return null;
    }
  })();

  return (
    <View
      accessibilityLabel={title}
      style={[
        styles.frame,
        { aspectRatio, backgroundColor: colors.mutedStrong, borderColor: colors.border },
        edgeToEdge && styles.edgeToEdge
      ]}
    >
      <WebView
        source={framed ? { html: iframeDocument(uri, colors.mutedStrong), baseUrl: serverUrl } : { uri }}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        allowsPictureInPictureMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={!framed}
        bounces={false}
        onLoadEnd={() => setLoading(false)}
        style={styles.webview}
        onShouldStartLoadWithRequest={(request) => {
          if (!request.isTopFrame || request.url === 'about:blank') return true;
          if (framed) return request.url.startsWith(serverUrl);

          let requestHost: string | null = null;
          try {
            requestHost = new URL(request.url).host;
          } catch {}
          if (requestHost === host || request.navigationType !== 'click') return true;

          void openExternal(request.url);
          return false;
        }}
      />
      {loading ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.loading]}>
          <Spinner />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  edgeToEdge: { borderWidth: 0, borderRadius: 0 },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loading: { alignItems: 'center', justifyContent: 'center' }
});
