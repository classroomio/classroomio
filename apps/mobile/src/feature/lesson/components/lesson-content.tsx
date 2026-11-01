import { useRef, useState } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Skeleton } from '@/feature/common/components/skeleton';
import { SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { buildLessonDocument, HEIGHT_MESSAGE, LESSON_DOCUMENT_SCRIPT } from '@/feature/lesson/helpers/lesson-html';
import { useOpenLink } from '@/feature/lesson/helpers/open-external';
import { useServer } from '@/feature/server/components/server-provider';

const MIN_HEIGHT = 48;

type LessonContentProps = { html: string; lang?: string | null };

export function LessonContent({ html, lang }: LessonContentProps) {
  const { colors, isDark } = useTheme();
  const { serverUrl } = useServer();
  const { openExternal } = useOpenLink();
  const [height, setHeight] = useState<number | null>(null);
  const loadedDocument = useRef<string | null>(null);
  const fontScale = Math.min(PixelRatio.getFontScale(), 1.6);
  const document = buildLessonDocument({ html, colors, isDark, fontScale, lang });

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; height?: number };
      if (message.type === HEIGHT_MESSAGE && typeof message.height === 'number') {
        setHeight(Math.max(MIN_HEIGHT, message.height));
      }
    } catch {}
  };

  return (
    <View style={[styles.frame, { height: height ?? 220 }]}>
      <WebView
        source={{ html: document, baseUrl: serverUrl }}
        originWhitelist={['*']}
        injectedJavaScript={LESSON_DOCUMENT_SCRIPT}
        onMessage={onMessage}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction
        setSupportMultipleWindows={false}
        allowsLinkPreview={false}
        dataDetectorTypes="none"
        style={[styles.webview, { backgroundColor: colors.background }]}
        containerStyle={{ backgroundColor: colors.background }}
        onLoadEnd={() => {
          loadedDocument.current = document;
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (loadedDocument.current !== document || !request.isTopFrame || request.url === 'about:blank') return true;

          void openExternal(request.url);
          return false;
        }}
      />
      {height === null ? (
        <View style={[StyleSheet.absoluteFill, styles.placeholder, { backgroundColor: colors.background }]}>
          <Skeleton height={16} width="92%" />
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="78%" />
          <Skeleton height={16} width="86%" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  webview: { flex: 1 },
  placeholder: { gap: SPACING.xs }
});
