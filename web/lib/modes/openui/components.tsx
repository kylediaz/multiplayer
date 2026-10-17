import { useTriggerAction } from "@openuidev/react-lang"
import { Fragment, useState } from "react"
import type { CSSProperties } from "react"
import { useTap } from "./actions"
import type {
  BubblesProps,
  MapViewProps,
  CardHeaderProps,
  CardProps,
  ChipsProps,
  HeroStatProps,
  ImageBlockProps,
  KVListProps,
  ListBlockProps,
  ListItemProps,
  PhotoGridProps,
  Renderer,
  StatTilesProps,
  TabsProps,
  TextCalloutProps,
  TextContentProps,
  ToggleProps,
} from "./contract"
import { iconTint, LucideIcon } from "./icons"
import { createImg } from "./media"
import { useCds } from "./theme"

const HAIR = 0.5

function IconBadge({ name }: { name: string }) {
  return (
    <span
      style={{
        width: 29,
        height: 29,
        borderRadius: 7,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: iconTint(name),
        flexShrink: 0,
      }}
    >
      <LucideIcon name={name} size={15} strokeWidth={2.2} color="#fff" />
    </span>
  )
}

const Img = createImg(() => useCds().fill)

const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  paddingTop: 11,
  paddingBottom: 11,
  paddingLeft: 16,
  paddingRight: 14,
  minHeight: 46,
  width: "100%",
  border: "none",
  background: "transparent",
  textAlign: "left",
  font: "inherit",
  color: "inherit",
}

export const Card: Renderer<CardProps> = ({ props, renderNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 15, paddingBottom: 8 }}>{renderNode(props.children)}</div>
)

export const CardHeader: Renderer<CardHeaderProps> = ({ props }) => {
  const theme = useCds()
  return (
    <div style={{ paddingTop: 18, paddingBottom: 14, paddingLeft: 2, paddingRight: 2 }}>
      {props.subtitle ? (
        <div style={{ marginBottom: 1, fontSize: 12, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: theme.ink2 }}>
          {props.subtitle}
        </div>
      ) : null}
      <div style={{ fontSize: 56, fontWeight: 300, letterSpacing: -1.5, lineHeight: "60px", color: theme.ink }}>{props.title}</div>
    </div>
  )
}

const TEXT_STYLES: Record<string, CSSProperties> = {
  small: { fontSize: 12.5, lineHeight: "18px" },
  default: { fontSize: 15, lineHeight: "22px" },
  large: { fontSize: 17, lineHeight: "24px" },
  "small-heavy": { fontSize: 13, lineHeight: "19px", fontWeight: 600 },
  "large-heavy": { fontSize: 20, lineHeight: "26px", fontWeight: 700, letterSpacing: -0.3, marginBottom: -6 },
}

export const TextContent: Renderer<TextContentProps> = ({ props }) => {
  const theme = useCds()
  const key = props.style ?? "default"
  const style = TEXT_STYLES[key] ?? TEXT_STYLES.default
  return <div style={{ paddingLeft: 2, paddingRight: 2, color: key === "small" ? theme.ink2 : theme.ink, ...style }}>{props.text}</div>
}

const CALLOUT_ICON: Record<string, string> = {
  neutral: "info",
  info: "info",
  success: "circle-check",
  warning: "triangle-alert",
  danger: "octagon-alert",
}

export const TextCallout: Renderer<TextCalloutProps> = ({ props }) => {
  const theme = useCds()
  const variant = props.variant ?? "neutral"
  const iconBg =
    variant === "info" ? theme.tint : variant === "success" ? theme.green : variant === "warning" ? "#ff9f0a" : variant === "danger" ? theme.red : "#8e8e93"
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "12px 14px", borderRadius: 14, backgroundColor: theme.group }}>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconBg,
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        <LucideIcon name={CALLOUT_ICON[variant] ?? "info"} size={16} color="#fff" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: "19px", color: theme.ink }}>{props.title}</div>
        {props.description ? <div style={{ marginTop: 1, fontSize: 13, lineHeight: "18px", color: theme.ink2 }}>{props.description}</div> : null}
      </div>
    </div>
  )
}

export const ListItem: Renderer<ListItemProps> = ({ props }) => {
  const theme = useCds()
  const onTap = useTap(props.title, props.action)
  const leading = props.leading
  const [pressed, setPressed] = useState(false)
  const body = (
    <>
      {typeof leading === "string" && leading ? (
        <IconBadge name={leading} />
      ) : leading && typeof leading === "object" && leading.src ? (
        <Img uri={leading.src} style={{ width: 42, height: 42, borderRadius: 9, backgroundColor: theme.fill }} />
      ) : null}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 500, lineHeight: "20px", color: theme.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {props.title}
        </span>
        {props.subtitle ? (
          <span style={{ display: "block", marginTop: 1, fontSize: 12.5, lineHeight: "17px", color: theme.ink2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {props.subtitle}
          </span>
        ) : null}
      </span>
      {props.trailing ? <span style={{ fontSize: 14.5, color: theme.ink2, fontVariantNumeric: "tabular-nums" }}>{props.trailing}</span> : null}
      {onTap ? <LucideIcon name="chevron-right" size={16} strokeWidth={2.4} color={theme.ink3} /> : null}
    </>
  )
  if (!onTap) return <div style={rowStyle}>{body}</div>
  return (
    <button
      type="button"
      onClick={onTap}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ ...rowStyle, cursor: "pointer", backgroundColor: pressed ? theme.fill : "transparent" }}
    >
      {body}
    </button>
  )
}

export const Toggle: Renderer<ToggleProps> = ({ props }) => {
  const theme = useCds()
  const [override, setOverride] = useState<boolean | null>(null)
  const on = override ?? !!props.on
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => setOverride(!on)} style={{ ...rowStyle, cursor: "pointer" }}>
      {props.icon ? <IconBadge name={props.icon} /> : null}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 500, lineHeight: "20px", color: theme.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {props.title}
        </span>
        {props.subtitle ? (
          <span style={{ display: "block", marginTop: 1, fontSize: 12.5, lineHeight: "17px", color: theme.ink2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {props.subtitle}
          </span>
        ) : null}
      </span>
      <span
        style={{
          width: 47,
          height: 28,
          borderRadius: 15,
          backgroundColor: on ? theme.green : theme.fill,
          padding: 2,
          display: "flex",
          justifyContent: on ? "flex-end" : "flex-start",
          flexShrink: 0,
        }}
      >
        <span style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", boxShadow: "0 2px 2.5px rgba(0,0,0,0.25)" }} />
      </span>
    </button>
  )
}

function Separator() {
  const theme = useCds()
  return <div style={{ height: HAIR, marginLeft: 16, backgroundColor: theme.sep }} />
}

function GroupHeader({ text }: { text: string }) {
  const theme = useCds()
  return (
    <div style={{ marginBottom: 7, marginLeft: 16, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: theme.ink2 }}>
      {text}
    </div>
  )
}

export const ListBlock: Renderer<ListBlockProps> = ({ props, renderNode }) => {
  const theme = useCds()
  const items = (Array.isArray(props.items) ? props.items : []).filter(Boolean)
  return (
    <div>
      {props.header ? <GroupHeader text={props.header} /> : null}
      <div style={{ backgroundColor: theme.group, borderRadius: 14, overflow: "hidden" }}>
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 ? <Separator /> : null}
            {renderNode(item)}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export const KVList: Renderer<KVListProps> = ({ props }) => {
  const theme = useCds()
  const rows = (props.rows ?? []).filter(Boolean)
  return (
    <div>
      {props.header ? <GroupHeader text={props.header} /> : null}
      <div style={{ backgroundColor: theme.group, borderRadius: 14, overflow: "hidden" }}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <Separator /> : null}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, padding: "11px 16px" }}>
              <span style={{ fontSize: 14, color: theme.ink2 }}>{row.label}</span>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500, textAlign: "right", color: theme.ink, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export const HeroStat: Renderer<HeroStatProps> = ({ props }) => {
  const theme = useCds()
  return (
    <div style={{ textAlign: "center", paddingTop: 6, paddingBottom: 2 }}>
      {props.label ? (
        <div style={{ marginBottom: 2, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: theme.ink2 }}>{props.label}</div>
      ) : null}
      <div style={{ fontSize: 56, fontWeight: 300, letterSpacing: -1.5, lineHeight: "60px", color: theme.ink, fontVariantNumeric: "tabular-nums" }}>{props.value}</div>
      {props.sublabel ? <div style={{ marginTop: 3, fontSize: 14, fontWeight: 500, color: theme.ink2 }}>{props.sublabel}</div> : null}
    </div>
  )
}

export const StatTiles: Renderer<StatTilesProps> = ({ props }) => {
  const theme = useCds()
  const items = (Array.isArray(props.items) ? props.items : []).filter(Boolean)
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {items.map((item, index) => {
        const deltaColor = item.delta?.trim().startsWith("-") ? theme.red : item.delta?.trim().startsWith("+") ? theme.green : theme.ink2
        return (
          <div key={index} style={{ flexGrow: 1, flexBasis: "45%", backgroundColor: theme.group, borderRadius: 14, padding: "11px 13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {item.icon ? <LucideIcon name={item.icon} size={13} strokeWidth={2.2} color={theme.ink2} /> : null}
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.ink2 }}>{item.label}</span>
            </div>
            <div style={{ marginTop: 3, display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.4, color: theme.ink, fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
              {item.delta ? <span style={{ fontSize: 12, fontWeight: 600, color: deltaColor }}>{item.delta}</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const ImageBlock: Renderer<ImageBlockProps> = ({ props }) => {
  const theme = useCds()
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "16 / 9", backgroundColor: theme.fill }}>
      <Img uri={props.src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {props.caption ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "26px 14px 11px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.62))",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: -0.2,
          }}
        >
          {props.caption}
        </div>
      ) : null}
    </div>
  )
}

export const PhotoGrid: Renderer<PhotoGridProps> = ({ props }) => {
  const theme = useCds()
  const images = (props.images ?? []).filter((image) => image?.src)
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 2.5, borderRadius: 16, overflow: "hidden", backgroundColor: theme.fill }}>
      {images.map((image, index) => (
        <Img key={index} uri={image.src} style={{ flexGrow: 1, flexBasis: "31%", aspectRatio: "1" }} />
      ))}
    </div>
  )
}

export const Bubbles: Renderer<BubblesProps> = ({ props }) => {
  const theme = useCds()
  const messages = (props.messages ?? []).filter((message) => message?.text)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 2, paddingRight: 2 }}>
      {messages.map((message, index) => (
        <Fragment key={index}>
          {message.time ? (
            <div style={{ marginTop: 8, marginBottom: 3, textAlign: "center", fontSize: 11, fontWeight: 500, color: theme.ink2 }}>{message.time}</div>
          ) : null}
          <div
            style={{
              maxWidth: "78%",
              padding: "8px 13px",
              borderRadius: 18,
              alignSelf: message.me ? "flex-end" : "flex-start",
              backgroundColor: message.me ? theme.tint : theme.bubble,
              borderBottomRightRadius: message.me ? 6 : 18,
              borderBottomLeftRadius: message.me ? 18 : 6,
              fontSize: 14.5,
              lineHeight: "20px",
              color: message.me ? "#fff" : theme.ink,
            }}
          >
            {message.text}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

export const Chips: Renderer<ChipsProps> = ({ props }) => {
  const theme = useCds()
  const triggerAction = useTriggerAction()
  const [active, setActive] = useState(0)
  const labels = (props.labels ?? []).filter(Boolean)
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 0", marginLeft: -14, marginRight: -14, paddingLeft: 14, paddingRight: 14 }}>
      {labels.map((label, index) => {
        const selected = index === active
        return (
          <button
            key={index}
            type="button"
            onClick={() => {
              if (selected) return
              setActive(index)
              triggerAction(`Apply the "${label}" filter and re-render this screen with only matching content`, undefined, undefined)
            }}
            style={{
              padding: "7px 14px",
              borderRadius: 17,
              backgroundColor: selected ? theme.ink : theme.group,
              border: selected ? "none" : `${HAIR}px solid ${theme.sep}`,
              color: selected ? theme.bg : theme.ink,
              font: "inherit",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export const Tabs: Renderer<TabsProps> = ({ props, renderNode }) => {
  const theme = useCds()
  const [active, setActive] = useState(0)
  const items = (Array.isArray(props.items) ? props.items : []).filter(Boolean) as Array<{
    props?: { label?: string; children?: unknown }
  }>
  const current = items[Math.min(active, Math.max(items.length - 1, 0))]
  return (
    <div>
      <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 10, backgroundColor: theme.fill }}>
        {items.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(index)}
            style={{
              flex: 1,
              padding: "6px 4px",
              borderRadius: 8,
              border: "none",
              backgroundColor: index === active ? theme.group : "transparent",
              boxShadow: index === active ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
              textAlign: "center",
              font: "inherit",
              fontSize: 13,
              fontWeight: 600,
              color: theme.ink,
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.props?.label ?? `Tab ${index + 1}`}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>{current ? renderNode(current.props?.children) : null}</div>
    </div>
  )
}

export const MapView: Renderer<MapViewProps> = ({ props }) => {
  const place = props.placeName ?? ""
  const zoom = typeof props.zoom === "number" ? props.zoom : 15
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=${zoom}&output=embed`
  return (
    <div style={{ width: "100%", height: 215, borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(120,120,128,0.14)" }}>
      <iframe src={src} title={place || "Map"} style={{ border: 0, width: "100%", height: "100%" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
    </div>
  )
}
