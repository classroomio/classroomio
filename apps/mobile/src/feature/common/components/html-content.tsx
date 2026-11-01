import { Image } from 'expo-image';
import { Check, ExternalLink, Square } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Linking, Text as NativeText, Pressable, StyleSheet, View, type TextStyle } from 'react-native';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { FONT_FAMILY, TEXT_VARIANTS } from '@/feature/common/constants/typography';
import { parseHtml, textContent, type HtmlElement, type HtmlNode } from '@/feature/common/helpers/parse-html';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Icon } from './icon';
import { Text, type TextTone } from './text';

type HtmlSize = 'body' | 'compact';

const BASE_STYLE: Record<HtmlSize, TextStyle> = {
  body: TEXT_VARIANTS.body,
  compact: { ...TEXT_VARIANTS.body, fontSize: 15, lineHeight: 22 }
};

const HEADING_STYLE: Record<string, TextStyle> = {
  h1: TEXT_VARIANTS.title,
  h2: { ...TEXT_VARIANTS.heading, fontSize: 19, lineHeight: 25 },
  h3: TEXT_VARIANTS.heading,
  h4: TEXT_VARIANTS.subheading,
  h5: TEXT_VARIANTS.subheading,
  h6: TEXT_VARIANTS.subheading
};

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'figure',
  'figcaption',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'hr',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'iframe',
  'video',
  'audio'
]);

const SAFE_LINK = /^(https?:|mailto:|tel:)/i;
const SAFE_IMAGE = /^(https?:|data:image\/(png|jpe?g|gif|webp);)/i;

type InlineFormat = { bold: boolean; italic: boolean; underline: boolean; strike: boolean };

const PLAIN: InlineFormat = { bold: false, italic: false, underline: false, strike: false };

type RenderContext = {
  size: HtmlSize;
  tone: TextTone;
  preserveLineBreaks: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
};

function isBlock(node: HtmlNode) {
  if (node.type !== 'element') return false;
  if (BLOCK_TAGS.has(node.tag)) return true;

  return node.attrs['data-type'] === 'block-math';
}

function normalizeWhitespace(text: string, context: RenderContext) {
  return context.preserveLineBreaks ? text : text.replace(/[ \t\r\n\f]+/g, ' ');
}

function openLink(href: string) {
  if (!SAFE_LINK.test(href)) return;

  void Linking.openURL(href);
}

function decorationOf(format: InlineFormat): TextStyle['textDecorationLine'] {
  if (format.underline && format.strike) return 'underline line-through';
  if (format.underline) return 'underline';
  if (format.strike) return 'line-through';

  return 'none';
}

function renderInline(node: HtmlNode, key: string, format: InlineFormat, context: RenderContext): ReactNode {
  if (node.type === 'text') return normalizeWhitespace(node.text, context);

  const children = (next: InlineFormat) =>
    node.children.map((child, index) => renderInline(child, `${key}.${index}`, next, context));

  switch (node.tag) {
    case 'br':
      return '\n';
    case 'strong':
    case 'b': {
      const next = { ...format, bold: true };
      return (
        <NativeText key={key} style={{ fontFamily: FONT_FAMILY.semibold }}>
          {children(next)}
        </NativeText>
      );
    }
    case 'em':
    case 'i':
      return (
        <NativeText key={key} style={styles.italic}>
          {children({ ...format, italic: true })}
        </NativeText>
      );
    case 'u': {
      const next = { ...format, underline: true };
      return (
        <NativeText key={key} style={{ textDecorationLine: decorationOf(next) }}>
          {children(next)}
        </NativeText>
      );
    }
    case 's':
    case 'del':
    case 'strike': {
      const next = { ...format, strike: true };
      return (
        <NativeText key={key} style={{ textDecorationLine: decorationOf(next) }}>
          {children(next)}
        </NativeText>
      );
    }
    case 'code':
    case 'kbd':
      return (
        <NativeText key={key} style={{ fontFamily: FONT_FAMILY.medium, backgroundColor: context.colors.sandStrong }}>
          {children(format)}
        </NativeText>
      );
    case 'mark':
      return (
        <NativeText key={key} style={{ backgroundColor: context.colors.warningTint }}>
          {children(format)}
        </NativeText>
      );
    case 'sub':
    case 'sup':
    case 'small':
      return (
        <NativeText key={key} style={styles.small}>
          {children(format)}
        </NativeText>
      );
    case 'a': {
      const href = node.attrs.href ?? '';
      const linkFormat = { ...format, underline: true };

      return (
        <NativeText
          key={key}
          accessibilityRole="link"
          onPress={SAFE_LINK.test(href) ? () => openLink(href) : undefined}
          style={{ color: context.colors.primaryText, textDecorationLine: decorationOf(linkFormat) }}
        >
          {children(linkFormat)}
        </NativeText>
      );
    }
    case 'span':
      if (node.attrs['data-type'] === 'inline-math') return node.attrs['data-latex'] ?? textContent(node.children);

      return children(format);
    default:
      return children(format);
  }
}

function trimRun(nodes: ReactNode[]) {
  const first = nodes[0];
  if (typeof first === 'string') nodes[0] = first.replace(/^\s+/, '');
  const lastIndex = nodes.length - 1;
  const last = nodes[lastIndex];
  if (typeof last === 'string') nodes[lastIndex] = last.replace(/\s+$/, '');

  return nodes;
}

function isBlank(nodes: HtmlNode[]) {
  return nodes.every((node) => node.type === 'text' && node.text.trim() === '');
}

function Paragraph({ style, children, context }: { style?: TextStyle; children: ReactNode; context: RenderContext }) {
  return (
    <Text selectable tone={context.tone} style={[BASE_STYLE[context.size], style]}>
      {children}
    </Text>
  );
}

function renderFlow(nodes: HtmlNode[], key: string, context: RenderContext, paragraphStyle?: TextStyle): ReactNode[] {
  const output: ReactNode[] = [];
  let run: HtmlNode[] = [];

  const flush = () => {
    if (run.length === 0) return;

    const pending = run;
    run = [];
    if (!context.preserveLineBreaks && isBlank(pending)) return;

    const inline = trimRun(
      pending.map((node, index) => renderInline(node, `${key}.r${output.length}.${index}`, PLAIN, context))
    );
    output.push(
      <Paragraph key={`${key}.p${output.length}`} style={paragraphStyle} context={context}>
        {inline}
      </Paragraph>
    );
  };

  nodes.forEach((node, index) => {
    if (!isBlock(node)) {
      run.push(node);
      return;
    }

    flush();
    output.push(renderBlock(node as HtmlElement, `${key}.${index}`, context));
  });
  flush();

  return output;
}

function renderBlock(node: HtmlElement, key: string, context: RenderContext): ReactNode {
  const { colors } = context;

  switch (node.tag) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return (
        <View key={key} accessibilityRole="header" style={styles.flow}>
          {renderFlow(node.children, key, { ...context, tone: 'ink' }, HEADING_STYLE[node.tag])}
        </View>
      );
    case 'p':
      if (isBlank(node.children) && !node.children.some((child) => child.type === 'element')) {
        return <View key={key} style={{ height: BASE_STYLE[context.size].lineHeight }} />;
      }

      return (
        <View key={key} style={styles.flow}>
          {renderFlow(node.children, key, context)}
        </View>
      );
    case 'ul':
    case 'ol':
      return <HtmlList key={key} node={node} keyPrefix={key} context={context} />;
    case 'blockquote':
      return (
        <View key={key} style={[styles.quote, { borderLeftColor: colors.borderStrong }]}>
          {renderFlow(node.children, key, { ...context, tone: 'muted' })}
        </View>
      );
    case 'pre':
      return (
        <View key={key} style={[styles.pre, { backgroundColor: colors.sand, borderColor: colors.border }]}>
          <Text selectable tone={context.tone} style={[BASE_STYLE.compact, styles.preText]}>
            {textContent(node.children).replace(/\n$/, '')}
          </Text>
        </View>
      );
    case 'hr':
      return <View key={key} style={[styles.rule, { backgroundColor: colors.border }]} />;
    case 'img':
      return <HtmlImage key={key} src={node.attrs.src ?? ''} alt={node.attrs.alt} />;
    case 'iframe':
    case 'video':
    case 'audio': {
      const src = node.attrs.src ?? findSource(node.children);

      return src ? <HtmlEmbed key={key} src={src} kind={node.tag} /> : null;
    }
    case 'table':
    case 'thead':
    case 'tbody':
      return (
        <View key={key} style={[styles.table, { borderColor: colors.border }]}>
          {node.children.map((child, index) =>
            child.type === 'element' ? renderBlock(child, `${key}.${index}`, context) : null
          )}
        </View>
      );
    case 'tr':
      return (
        <View key={key} style={[styles.tableRow, { borderColor: colors.border }]}>
          {node.children.map((cell, index) =>
            cell.type === 'element' ? (
              <View key={`${key}.${index}`} style={styles.tableCell}>
                {renderFlow(
                  cell.children,
                  `${key}.${index}`,
                  context,
                  cell.tag === 'th' ? { fontFamily: FONT_FAMILY.semibold } : undefined
                )}
              </View>
            ) : null
          )}
        </View>
      );
    default:
      if (node.attrs['data-type'] === 'block-math') {
        return (
          <Paragraph key={key} context={context} style={styles.center}>
            {node.attrs['data-latex'] ?? textContent(node.children)}
          </Paragraph>
        );
      }

      if (node.attrs['data-type'] === 'callout') {
        return (
          <View key={key} style={[styles.callout, { backgroundColor: colors.primaryTint }]}>
            {renderFlow(node.children, key, context)}
          </View>
        );
      }

      return (
        <View key={key} style={styles.flow}>
          {renderFlow(node.children, key, context)}
        </View>
      );
  }
}

function findSource(nodes: HtmlNode[]): string | undefined {
  for (const node of nodes) {
    if (node.type === 'element' && node.tag === 'source' && node.attrs.src) return node.attrs.src;
  }

  return undefined;
}

function HtmlList({ node, keyPrefix, context }: { node: HtmlElement; keyPrefix: string; context: RenderContext }) {
  const ordered = node.tag === 'ol';
  const start = Number(node.attrs.start ?? 1) || 1;
  const isTaskList = node.attrs['data-type'] === 'taskList';
  const items = node.children.filter((child): child is HtmlElement => child.type === 'element' && child.tag === 'li');
  const lineHeight = BASE_STYLE[context.size].lineHeight ?? 24;

  return (
    <View style={styles.list}>
      {items.map((item, index) => {
        const checked = item.attrs['data-checked'] === 'true';
        const marker = isTaskList ? (
          <View style={[styles.marker, { height: lineHeight }]}>
            <Icon icon={checked ? Check : Square} size={16} tone={checked ? 'success' : 'muted'} />
          </View>
        ) : (
          <View style={[styles.marker, { height: lineHeight }]}>
            <Text tone="muted" style={BASE_STYLE[context.size]}>
              {ordered ? `${start + index}.` : '•'}
            </Text>
          </View>
        );
        const content = item.children.flatMap((child) =>
          child.type === 'element' && child.tag === 'label' ? [] : [child]
        );

        return (
          <View key={`${keyPrefix}.${index}`} style={styles.listItem}>
            {marker}
            <View style={styles.listBody}>{renderFlow(content, `${keyPrefix}.${index}`, context)}</View>
          </View>
        );
      })}
    </View>
  );
}

function HtmlImage({ src, alt }: { src: string; alt?: string }) {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const [aspectRatio, setAspectRatio] = useState(4 / 3);
  if (!SAFE_IMAGE.test(src)) return null;

  return (
    <Image
      source={{ uri: src }}
      accessibilityLabel={alt || t('image')}
      contentFit="contain"
      transition={120}
      recyclingKey={src}
      onLoad={(event) => {
        const { width, height } = event.source;
        if (width > 0 && height > 0) setAspectRatio(width / height);
      }}
      style={[styles.image, { aspectRatio, backgroundColor: colors.sand }]}
    />
  );
}

const EMBED_LABEL_KEYS: Record<string, 'openEmbeddedContent' | 'openVideo' | 'openAudio'> = {
  iframe: 'openEmbeddedContent',
  video: 'openVideo',
  audio: 'openAudio'
};

function HtmlEmbed({ src, kind }: { src: string; kind: string }) {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();
  if (!SAFE_LINK.test(src)) return null;

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openLink(src)}
      style={[styles.embed, { backgroundColor: colors.sand, borderColor: colors.border }]}
    >
      <Icon icon={ExternalLink} size={16} tone="muted" />
      <Text variant="captionStrong" numberOfLines={1} style={styles.embedLabel}>
        {t(EMBED_LABEL_KEYS[kind] ?? 'openLink')}
      </Text>
    </Pressable>
  );
}

type HtmlContentProps = {
  html: string | null | undefined;
  size?: HtmlSize;
  tone?: TextTone;
  /** Keeps newlines in text nodes, for plain-text comments that are stored without paragraph markup. */
  preserveLineBreaks?: boolean;
};

/**
 * Renders stored editor HTML with native text and images. Scripts, styles and unknown markup are dropped,
 * and links open in the system browser only for http, mailto and tel URLs.
 */
export function HtmlContent({ html, size = 'body', tone = 'body', preserveLineBreaks = false }: HtmlContentProps) {
  const { colors } = useTheme();
  const nodes = parseHtml(preserveLineBreaks ? (html ?? '').trim() : (html ?? ''));
  const context: RenderContext = { size, tone, preserveLineBreaks, colors };

  return <View style={styles.root}>{renderFlow(nodes, 'h', context)}</View>;
}

const styles = StyleSheet.create({
  root: { gap: SPACING.sm },
  flow: { gap: SPACING.xs },
  italic: { fontStyle: 'italic' },
  small: { fontSize: 12 },
  center: { textAlign: 'center' },
  quote: { borderLeftWidth: 3, paddingLeft: SPACING.sm, gap: SPACING.xs },
  pre: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.md,
    borderCurve: 'continuous',
    padding: SPACING.sm
  },
  preText: { fontFamily: FONT_FAMILY.regular },
  rule: { height: StyleSheet.hairlineWidth * 2, marginVertical: SPACING.xs },
  list: { gap: SPACING.xxs },
  listItem: { flexDirection: 'row', gap: SPACING.xs },
  marker: { minWidth: 18, alignItems: 'flex-end', justifyContent: 'center' },
  listBody: { flex: 1, gap: SPACING.xs },
  image: { width: '100%', borderRadius: RADII.md, borderCurve: 'continuous' },
  embed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  },
  embedLabel: { flex: 1 },
  callout: { gap: SPACING.xs, padding: SPACING.sm, borderRadius: RADII.md, borderCurve: 'continuous' },
  table: { borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: RADII.sm, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  tableCell: { flex: 1, padding: SPACING.xs }
});
