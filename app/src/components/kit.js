
import { useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import { Image } from "expo-image";
import { colors, radius, spacing, typography, shadows } from "../tokens";
import Icon, { resolveIconName, isEmoji } from "./Icon";
import { resolverImagen } from "../lib/imagenes";
import { go } from "../lib/nav";
import { focoVisible, etiqueta } from "../lib/a11y";

// Kit de UI: un componente por primitiva del wireframe (prototipo/code.js).
// Las pantallas reales (Fases 1-4) se componen SOLO con estos elementos.

// Contenedor pulsable accesible: rol, etiqueta combinada, estado y foco visible
// (4.1.2 Nombre, función, valor · 2.4.7 Foco visible · 2.5.3 Etiqueta en el nombre).
function Tappable({ onPress, label, role = "button", state, hint, children }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={state}
      style={(s) => [s.pressed && styles.pressed, focoVisible(s)]}
    >
      {children}
    </Pressable>
  );
}

export function Greet({ title, sub }) {
  return (
    <View style={styles.greetBox}>
      <Text style={styles.greetTitle} accessibilityRole="header">{title}</Text>
      {sub ? <Text style={styles.greetSub}>{sub}</Text> : null}
    </View>
  );
}

// Cabecera cálida de bienvenida: avatar + iconos + saludo (a sangre completa).
export function Header({ iniciales = "R", title, sub, alertas }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.avatarText}>{iniciales}</Text>
        </View>
        <View style={styles.headerIcons}>
          <Pressable
            onPress={() => go("PRE-03")}
            accessibilityRole="button"
            accessibilityLabel={
              alertas > 0
                ? `Alertas de vencimiento: ${alertas} ${alertas === 1 ? "insumo requiere" : "insumos requieren"} atención`
                : "Alertas de vencimiento"
            }
            style={(s) => [styles.headerBtn, s.pressed && styles.pressed, focoVisible(s)]}
          >
            <Icon name="notifications-outline" size={22} color={colors.primaryDark} />
            {alertas > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{alertas}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
      <Text style={styles.headerTitle} accessibilityRole="header">{title}</Text>
      {sub ? <Text style={styles.headerSub}>{sub}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, action, onPress }) {
  return (
    <View style={styles.secRow}>
      <Text style={styles.secTitle} accessibilityRole="header">{title}</Text>
      {action ? (
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={etiqueta(action, title)}
          style={(s) => [styles.secActionBtn, focoVisible(s)]}
        >
          <Text style={styles.secAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function TextLine({ text, color, bold }) {
  return (
    <Text style={[styles.textLine, color ? { color } : null, bold && styles.textBold]}>
      {text}
    </Text>
  );
}

export function Card({ thumb, title, sub, subColor, right, onPress }) {
  const body = (
    <View style={styles.card}>
      {thumb ? <Image source={resolverImagen(thumb)} style={styles.cardThumb} contentFit="cover" accessible={false} /> : null}
      <View style={styles.cardMain}>
        <Text style={styles.cardTitle}>{title}</Text>
        {sub ? <Text style={[styles.cardSub, subColor ? { color: subColor } : null]}>{sub}</Text> : null}
      </View>
      {right ? <Text style={styles.cardRight}>{right}</Text> : null}
    </View>
  );
  return onPress ? (
    <Tappable onPress={onPress} label={etiqueta(title, sub, right)}>
      {body}
    </Tappable>
  ) : (
    body
  );
}

export function Row({ label, value, valueColor, icon, onPress }) {
  const iconName = resolveIconName(icon);
  const isInitial = typeof icon === "string" && /^[A-Za-z0-9]$/.test(icon);
  const symValue = typeof value === "string" && value.length <= 2 &&
    (isEmoji(value) || value === "✓" || value === "!" || value === "★");
  let iconColor = colors.muted;
  if (iconName === "checkmark") iconColor = colors.green;
  else if (iconName === "alert-circle-outline") iconColor = colors.amber;
  const valorTexto = symValue ? (value === "!" ? "requiere atención" : value === "★" ? "favorito" : "correcto") : value;
  const etiquetaFila = etiqueta(label, valorTexto);
  const body = (
    <View
      style={styles.row}
      accessible={!onPress}
      accessibilityLabel={!onPress ? etiquetaFila : undefined}
    >
      <View style={styles.rowIcon}>
        {iconName ? (
          <Icon name={iconName} size={15} color={iconColor} />
        ) : isInitial ? (
          <Text style={styles.rowIconText}>{icon}</Text>
        ) : (
          <Icon name="ellipse" size={8} color={colors.muted} />
        )}
      </View>
      <Text style={styles.rowLabel}>
        {label}
      </Text>
      {value ? (
        symValue ? (
          <Icon
            name={value === "!" ? "alert-circle-outline" : value === "★" ? "star" : "checkmark"}
            size={16}
            color={value === "!" ? colors.amber : colors.green}
          />
        ) : (
          <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>
            {value}
          </Text>
        )
      ) : null}
    </View>
  );
  return onPress ? (
    <Tappable onPress={onPress} label={etiquetaFila}>
      {body}
    </Tappable>
  ) : (
    body
  );
}

export function Chips({ items = [], active, ok, onPressItem, hintItem }) {
  return (
    <View style={styles.chipsRow}>
      {items.map((it, i) => {
        const label = typeof it === "object" && it !== null ? it.label : it;
        const tone = typeof it === "object" && it !== null ? it.tone : null;
        const toneStyle =
          tone === "green" ? styles.chipGreen
          : tone === "amber" ? styles.chipAmber
          : tone === "red" ? styles.chipRed
          : null;
        const toneText =
          tone === "green" ? styles.chipTextGreen
          : tone === "amber" ? styles.chipTextAmber
          : tone === "red" ? styles.chipTextRed
          : null;
        const isActive = !ok && !tone && label === active;
        const chip = (
          <View style={[styles.chip, ok && styles.chipOk, toneStyle, isActive && styles.chipActive]}>
            <Text style={[styles.chipText, ok && styles.chipTextOk, toneText, isActive && styles.chipTextActive]}>
              {label}
            </Text>
          </View>
        );
        return onPressItem ? (
          <Pressable
            key={i}
            onPress={() => onPressItem(label)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={hintItem}
            accessibilityState={{ selected: !!isActive }}
            style={(s) => [s.pressed && styles.pressed, focoVisible(s)]}
          >
            {chip}
          </Pressable>
        ) : (
          <View key={i}>{chip}</View>
        );
      })}
    </View>
  );
}

// Acción rápida con icono (reemplaza los "enlaces sueltos" del wireframe).
export function QuickAction({ icon, label, sub, onPress, variant }) {
  const prim = variant === "primary";
  const body = (
    <View style={[styles.qa, prim && styles.qaPrim]}>
      <View style={[styles.qaIcon, prim && styles.qaIconPrim]}>
        <Icon name={icon} size={16} color={prim ? colors.white : colors.primary} />
      </View>
      <View style={styles.qaMain}>
        <Text style={[styles.qaLabel, prim && styles.qaLabelPrim]}>{label}</Text>
        {sub ? <Text style={[styles.qaSub, prim && styles.qaLabelPrim]}>{sub}</Text> : null}
      </View>
      <Icon name="chevron-forward" size={16} color={prim ? colors.white : colors.muted} />
    </View>
  );
  return onPress ? (
    <Tappable onPress={onPress} label={etiqueta(label, sub)}>
      {body}
    </Tappable>
  ) : (
    body
  );
}

export function Note({ text, onPress, alerta }) {
  const body = (
    <View
      style={styles.note}
      accessibilityRole={alerta && !onPress ? "alert" : undefined}
      accessibilityLiveRegion={alerta ? "assertive" : undefined}
    >
      <Icon name="warning-outline" size={14} color={colors.amber} style={styles.noteIcon} />
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
  return onPress ? (
    <Tappable onPress={onPress} label={text}>
      {body}
    </Tappable>
  ) : (
    body
  );
}

export function Banner({ title, sub, tone }) {
  const palette =
    tone === "GREEN"
      ? { bg: colors.greenBg, fg: colors.green }
      : tone === "PRIMARY"
        ? { bg: colors.primaryLight, fg: colors.primary }
        : { bg: colors.redBg, fg: colors.red };
  return (
    <View
      style={[styles.banner, { backgroundColor: palette.bg }]}
      accessible
      accessibilityRole={tone === "GREEN" || tone === "PRIMARY" ? undefined : "alert"}
      accessibilityLiveRegion={tone === "GREEN" || tone === "PRIMARY" ? "polite" : "assertive"}
      accessibilityLabel={etiqueta(title, sub)}
    >
      <Text style={[styles.bannerTitle, { color: palette.fg }]}>{title}</Text>
      {sub ? <Text style={[styles.bannerSub, { color: palette.fg }]}>{sub}</Text> : null}
    </View>
  );
}

export function Stat({ value, label, delta }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={etiqueta(label, value, delta)}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {delta ? <Text style={styles.statDelta}>{delta}</Text> : null}
    </View>
  );
}

export function BalanceCard({ label, pct, text, link, onPress }) {
  const body = (
    <View style={styles.balance}>
      <View style={styles.balanceTop}>
        <Text style={styles.balanceLabel}>{label}</Text>
        <Text style={styles.balancePct}>{pct}</Text>
      </View>
      <Text style={styles.balanceText}>{text}</Text>
      {link ? <Text style={styles.balanceLink}>{link}</Text> : null}
    </View>
  );
  return onPress ? (
    <Tappable onPress={onPress} label={etiqueta(label, pct, text, link)}>
      {body}
    </Tappable>
  ) : (
    body
  );
}

export function RadioOption({ title, sub, selected, onPress }) {
  const body = (
    <View style={[styles.radio, selected && styles.radioOn]}>
      <View style={[styles.radioDot, selected && styles.radioDotOn]}>
        {selected ? <View style={styles.radioDotInner} /> : null}
      </View>
      <View style={styles.radioMain}>
        <Text style={styles.radioTitle}>{title}</Text>
        {sub ? <Text style={styles.radioSub}>{sub}</Text> : null}
      </View>
    </View>
  );
  return onPress ? (
    <Tappable onPress={onPress} label={etiqueta(title, sub)} role="radio" state={{ checked: !!selected }}>
      {body}
    </Tappable>
  ) : (
    body
  );
}

export function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  accessibilityLabel,
  editable = true,
}) {
  // 3.3.2 Etiquetas o instrucciones: `label` visible sobre el campo (el placeholder
  // no sustituye a la etiqueta). 1.3.5 Identificar el propósito: autoComplete/textContentType.
  const nombre = accessibilityLabel || label || placeholder;
  if (onChangeText) {
    return (
      <View>
        {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
        <View style={styles.input}>
          <TextInput
            style={styles.inputLive}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            autoComplete={autoComplete}
            textContentType={textContentType}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            editable={editable}
            accessibilityLabel={nombre}
          />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.input} accessible accessibilityLabel={nombre}>
      <Text style={styles.inputText}>{placeholder}</Text>
    </View>
  );
}

export function EmptyState({ title, sub }) {
  return (
    <View style={styles.empty} accessible accessibilityLabel={etiqueta(title, sub)}>
      <Icon name="leaf-outline" size={32} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
    </View>
  );
}

export function Loading({ text }) {
  return (
    <View
      style={styles.loading}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={text || "Cargando"}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion="polite"
    >
      <Icon name="hourglass-outline" size={24} color={colors.primary} />
      <Text style={styles.loadingText}>{text || "Cargando…"}</Text>
    </View>
  );
}

export function ErrorState({ text, onRetry }) {
  const body = (
    <View
      style={styles.errorBox}
      accessibilityRole={onRetry ? undefined : "alert"}
      accessibilityLiveRegion="assertive"
    >
      <Icon name="cloud-offline-outline" size={28} color={colors.red} />
      <Text style={styles.errorText}>{text || "Algo salió mal cargando los datos."}</Text>
      {onRetry ? <Text style={styles.errorRetry}>Tocar para reintentar</Text> : null}
    </View>
  );
  return onRetry ? (
    <Tappable onPress={onRetry} label={etiqueta(text || "Algo salió mal cargando los datos.", "Tocar para reintentar")}>
      {body}
    </Tappable>
  ) : (
    body
  );
}

export function Progress({ label, right, pct }) {
  return (
    <View
      style={styles.prog}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta(label, right)}
      accessibilityValue={{ min: 0, max: 100, now: Math.round((pct || 0) * 100) }}
    >
      <View style={styles.progTop}>
        <Text style={styles.progLabel}>{label}</Text>
        {right ? <Text style={styles.progRight}>{right}</Text> : null}
      </View>
      <View style={styles.progTrack}>
        <View style={[styles.progFill, { width: `${Math.round((pct || 0) * 100)}%` }]} />
      </View>
    </View>
  );
}

export function LinkText({ label, align, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={6}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={(s) => [styles.linkBtn, focoVisible(s)]}
    >
      <Text style={[styles.link, { textAlign: String(align || "left").toLowerCase() }]}>{label}</Text>
    </Pressable>
  );
}

function PhotoPlaceholder({ height, imagen }) {
  const [error, setError] = useState(false);
  const fuente = resolverImagen(imagen);
  if (fuente && !error) {
    return (
      <Image
        source={fuente}
        style={[styles.photoImg, { height }]}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        accessible={false}
        onError={() => setError(true)}
      />
    );
  }
  return (
    <View style={[styles.photoPh, { height }]}>
      <Icon name="restaurant-outline" size={46} color={colors.primary} />
      <Text style={styles.photoPhText} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">Foto de la receta</Text>
    </View>
  );
}

export function PhotoCard({ imagen, title, sub, price, time, status, statusTone, cta, onPress }) {
  const warn = statusTone === "amber";
  const body = (
    <View style={styles.photoCard}>
      <PhotoPlaceholder height={150} imagen={imagen} />
      <View style={styles.photoBody}>
        <View style={styles.photoTop}>
          <Text style={styles.photoTitle}>
            {title}
          </Text>
          {price ? <Text style={styles.photoPrice}>{price}</Text> : null}
        </View>
        {sub ? <Text style={styles.photoSub}>{sub}</Text> : null}
        <View style={styles.photoBottom}>
          {status ? (
            <View style={[styles.pillOk, warn && styles.pillWarn]}>
              <Icon
                name={warn ? "alert-circle-outline" : "checkmark"}
                size={12}
                color={warn ? colors.amber : colors.green}
              />
              <Text style={[styles.pillOkText, warn && styles.pillWarnText]}>{status}</Text>
            </View>
          ) : (
            <View />
          )}
          {cta ? <Text style={styles.photoCta}>{cta}</Text> : null}
        </View>
        {time ? (
          <View style={styles.metaRow}>
            <Icon name="time-outline" size={12} color={colors.muted} />
            <Text style={styles.photoTime}>{time}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
  return onPress ? (
    <Tappable onPress={onPress} label={etiqueta(title, sub, price, status, cta, time)}>
      {body}
    </Tappable>
  ) : (
    body
  );
}

export function Hero({ imagen, title, price, time }) {
  return (
    <View
      style={styles.hero}
      accessible
      accessibilityLabel={etiqueta(title, time, price ? `${price} por porción` : null)}
    >
      <PhotoPlaceholder height={230} imagen={imagen} />
      {time ? (
        <View style={[styles.pill, styles.pillTime]}>
          <Icon name="time-outline" size={12} color={colors.text} />
          <Text style={styles.pillTimeText}>{time}</Text>
        </View>
      ) : null}
      {price ? (
        <View style={[styles.pill, styles.pillPrice]}>
          <Text style={styles.pillPriceText}>{price} /poc.</Text>
        </View>
      ) : null}
      {title ? (
        <View style={styles.heroScrim}>
          <Text style={styles.heroTitle}>{title}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function Heart({ activo, onPress, style }) {
  const body = (
    <View style={styles.heart}>
      <Icon name={activo ? "heart" : "heart-outline"} size={20} color={activo ? colors.red : colors.muted} />
    </View>
  );
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={activo ? "Quitar de favoritas" : "Agregar a favoritas"}
      accessibilityState={{ selected: !!activo }}
      style={(s) => [style, s.pressed && styles.pressed, focoVisible(s)]}
    >
      {body}
    </Pressable>
  );
}

export function CheckCircle({ title }) {
  return (
    <View style={styles.checkBox} accessible accessibilityLabel={title} accessibilityLiveRegion="polite">
      <View style={styles.checkCircle}>
        <Icon name="checkmark" size={30} color={colors.white} />
      </View>
      <Text style={styles.checkTitle}>{title}</Text>
    </View>
  );
}

export function EditStepper({ label, qty, onChange }) {
  // 2.5.8 / 2.5.5: botones de 44x44; 4.1.2: cada botón nombra qué ajusta;
  // 4.1.3: el valor se anuncia al cambiar (región viva educada).
  const botones = [
    { delta: -1, simbolo: "−", accion: "Disminuir" },
    { delta: 1, simbolo: "+", accion: "Aumentar" },
  ];
  return (
    <View
      style={styles.stepper}
      accessible={!onChange}
      accessibilityLabel={!onChange ? etiqueta(label, qty) : undefined}
    >
      <Text
        style={styles.stepperLabel}
        accessibilityElementsHidden={!!onChange}
        importantForAccessibility={onChange ? "no" : "auto"}
      >
        {label}
      </Text>
      <View style={styles.stepperRight}>
        <Text style={styles.stepperQty} accessibilityLabel={`${label}: ${qty}`} accessibilityLiveRegion="polite">
          {qty}
        </Text>
        {onChange ? (
          <View style={styles.stepperBtnsRow}>
            {botones.map((b) => (
              <Pressable
                key={b.delta}
                onPress={() => onChange(b.delta)}
                accessibilityRole="button"
                accessibilityLabel={`${b.accion} ${label}`}
                style={(st) => [styles.stepperBtn, st.pressed && styles.pressed, focoVisible(st)]}
              >
                <Text style={styles.stepperBtns} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {b.simbolo}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.stepperBtns} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            −   +
          </Text>
        )}
      </View>
    </View>
  );
}

export function CameraView({ modo = "Boleta", hint, onPress }) {
  // El modo (Boleta / Lista) se elige en la pantalla que usa el componente
  // (ver DES-04), así evitamos duplicar los chips dentro del visor.
  const body = (
    <View
      style={styles.camera}
      accessible
      accessibilityLabel={etiqueta(`Vista de cámara, modo ${modo}`, hint)}
    >
      <View style={styles.cameraGuide} />
      <Text style={styles.cameraHint}>
        {hint || "Encuadra la boleta completa con buena luz"}
      </Text>
      <View style={styles.shutterOuter}>
        <View style={styles.shutterInner} />
      </View>
    </View>
  );
  return onPress ? (
    <Tappable onPress={onPress} label={"Tomar foto"}>
      {body}
    </Tappable>
  ) : (
    body
  );
}

export function Logo({ tagline }) {
  return (
    <View style={styles.logoBox} accessible accessibilityRole="header" accessibilityLabel={etiqueta("Haymax", tagline)}>
      <View style={styles.logoMark}>
        <Icon name="restaurant-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.logoName}>Haymax</Text>
      {tagline ? <Text style={styles.logoTag}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  greetBox: { marginBottom: 8 },
  greetTitle: { fontSize: 23, fontWeight: typography.weights.bold, color: colors.text },
  greetSub: { fontSize: typography.sizes.body, color: colors.sub, marginTop: 2 },

  header: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 4,
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: typography.weights.bold, color: colors.white },
  headerIcons: { flexDirection: "row", gap: 14 },
  headerBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 2, right: 0, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.red, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 11, fontWeight: typography.weights.bold, color: colors.white },
  headerTitle: { fontSize: 26, fontWeight: typography.weights.bold, color: colors.text, lineHeight: 31 },
  headerSub: { fontSize: typography.sizes.body, color: colors.sub, marginTop: 4 },

  secRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm, marginBottom: 6 },
  secTitle: { fontSize: typography.sizes.subtitle, fontWeight: typography.weights.bold, color: colors.text, flex: 1 },
  secActionBtn: { minHeight: 44, justifyContent: "center" },
  secAction: { fontSize: typography.sizes.small, fontWeight: typography.weights.semibold, color: colors.primary },

  textLine: { fontSize: typography.sizes.body, color: colors.sub, lineHeight: 19, marginBottom: 8 },
  textBold: { fontSize: typography.sizes.title, fontWeight: typography.weights.bold, color: colors.text },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.card,
  },
  cardMain: { flex: 1 },
  cardThumb: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  cardTitle: { fontSize: typography.sizes.label, fontWeight: typography.weights.semibold, color: colors.text },
  cardSub: { fontSize: typography.sizes.small, color: colors.sub, marginTop: 4 },
  cardRight: { fontSize: typography.sizes.small, fontWeight: typography.weights.semibold, color: colors.primary },

  row: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.greyBg, alignItems: "center", justifyContent: "center" },
  rowIconText: { fontSize: typography.sizes.small, color: colors.muted },
  rowLabel: { flex: 1, fontSize: 14, color: colors.text },
  rowValue: { fontSize: 13, fontWeight: typography.weights.semibold, color: colors.green, maxWidth: 140, textAlign: "right" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: 4 },
  chip: { height: 32, borderRadius: radius.pill, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipOk: { backgroundColor: colors.greenBg, borderColor: colors.greenBg },
  chipText: { fontSize: typography.sizes.small, color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: typography.weights.semibold },
  chipTextOk: { color: colors.green },
  chipGreen: { backgroundColor: colors.greenBg, borderColor: colors.greenBg },
  chipAmber: { backgroundColor: colors.amberBg, borderColor: colors.amberBg },
  chipRed: { backgroundColor: colors.redBg, borderColor: colors.redBg },
  chipTextGreen: { color: colors.green, fontWeight: typography.weights.semibold },
  chipTextAmber: { color: colors.amber, fontWeight: typography.weights.semibold },
  chipTextRed: { color: colors.red, fontWeight: typography.weights.semibold },

  qa: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 12, flexDirection: "row", alignItems: "center", gap: spacing.sm, ...shadows.card },
  qaPrim: { backgroundColor: colors.primary },
  qaIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  qaIconPrim: { backgroundColor: colors.primaryDark },
  qaMain: { flex: 1 },
  qaLabel: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.text },
  qaLabelPrim: { color: colors.white },
  qaSub: { fontSize: typography.sizes.small, color: colors.sub, marginTop: 2 },

  note: { backgroundColor: colors.amberBg, borderRadius: radius.lg, padding: 12, flexDirection: "row", gap: 6, alignItems: "flex-start" },
  noteIcon: { marginTop: 1 },
  noteText: { fontSize: 11.5, color: colors.amber, lineHeight: 16, flex: 1 },

  banner: { borderRadius: radius.md, padding: 12, marginBottom: 4 },
  bannerTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold },
  bannerSub: { fontSize: 11.5, marginTop: 4, opacity: 0.9 },

  stat: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, position: "relative", ...shadows.card },
  statValue: { fontSize: typography.sizes.hero, fontWeight: typography.weights.bold, color: colors.primary },
  statLabel: { fontSize: typography.sizes.small, color: colors.sub, marginTop: 6 },
  statDelta: { position: "absolute", right: 16, top: 22, fontSize: 14, fontWeight: typography.weights.bold, color: colors.green },

  balance: { backgroundColor: colors.greenBg, borderRadius: radius.lg, padding: 14 },
  balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold, color: colors.green, letterSpacing: 0.7 },
  balancePct: { fontSize: 13, fontWeight: typography.weights.bold, color: colors.green },
  balanceText: { fontSize: typography.sizes.small, color: colors.text, marginTop: 8, lineHeight: 17 },
  balanceLink: { fontSize: typography.sizes.small, fontWeight: typography.weights.semibold, color: colors.green, marginTop: 8 },

  radio: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row", gap: spacing.sm, marginBottom: 4 },
  radioOn: { borderColor: colors.primary, borderWidth: 1.8 },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.6, borderColor: colors.muted, marginTop: 2, alignItems: "center", justifyContent: "center" },
  radioDotOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  radioMain: { flex: 1 },
  radioTitle: { fontSize: 14, fontWeight: typography.weights.semibold, color: colors.text },
  radioSub: { fontSize: 11.5, color: colors.sub, marginTop: 4 },

  inputLabel: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: 6 },
  input: { minHeight: 46, borderRadius: radius.md, backgroundColor: colors.field, borderWidth: 1, borderColor: colors.border, justifyContent: "center", paddingHorizontal: 14 },
  inputText: { fontSize: typography.sizes.body, color: colors.muted },
  inputLive: { fontSize: typography.sizes.body, color: colors.text, paddingVertical: 0 },

  empty: { height: 130, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.field, alignItems: "center", justifyContent: "center", padding: spacing.md, gap: spacing.sm },
  emptyTitle: { fontSize: typography.sizes.body, color: colors.sub, textAlign: "center" },
  emptySub: { fontSize: typography.sizes.small, color: colors.muted, textAlign: "center", marginTop: 6 },

  loading: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: spacing.sm },
  loadingText: { fontSize: typography.sizes.body, color: colors.sub },

  errorBox: { backgroundColor: colors.redBg, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", gap: spacing.sm },
  errorText: { fontSize: typography.sizes.body, color: colors.red, textAlign: "center" },
  errorRetry: { fontSize: typography.sizes.small, fontWeight: typography.weights.semibold, color: colors.red, textDecorationLine: "underline" },

  prog: { marginBottom: 4 },
  progTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progLabel: { fontSize: 14, fontWeight: typography.weights.semibold, color: colors.text },
  progRight: { fontSize: 13, fontWeight: typography.weights.semibold, color: colors.green },
  progTrack: { height: 8, borderRadius: 4, backgroundColor: colors.track, marginTop: 8, overflow: "hidden" },
  progFill: { height: 8, borderRadius: 4, backgroundColor: colors.green },

  linkBtn: { minHeight: 44, justifyContent: "center" },
  link: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.primary, paddingVertical: 4, marginBottom: 4 },

  photoCard: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: "hidden", ...shadows.card },
  photoPh: { backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", gap: 6 },
  photoImg: { width: "100%", backgroundColor: colors.primaryLight },
  photoPhText: { fontSize: typography.sizes.small, color: colors.primary },
  photoBody: { padding: 14, gap: 6 },
  photoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  photoTitle: { flex: 1, fontSize: 17, fontWeight: typography.weights.bold, color: colors.text },
  photoPrice: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.primary },
  photoSub: { fontSize: typography.sizes.small, color: colors.sub },
  photoBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  photoCta: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.primary },
  photoTime: { fontSize: typography.sizes.caption, color: colors.muted },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pillOk: { backgroundColor: colors.greenBg, borderRadius: radius.pill, paddingHorizontal: 14, height: 26, justifyContent: "center", flexDirection: "row", alignItems: "center", gap: 4 },
  pillOkText: { fontSize: typography.sizes.caption, color: colors.green, fontWeight: typography.weights.semibold },
  pillWarn: { backgroundColor: colors.amberBg },
  pillWarnText: { color: colors.amber },

  hero: { borderRadius: radius.lg, overflow: "hidden", marginBottom: 4 },
  heart: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", ...shadows.card },
  pill: { position: "absolute", borderRadius: radius.pill, paddingHorizontal: 12, height: 26, justifyContent: "center", backgroundColor: colors.white, flexDirection: "row", alignItems: "center", gap: 4 },
  pillTime: { top: 12, left: 12 },
  pillTimeText: { fontSize: typography.sizes.caption, color: colors.text },
  pillPrice: { bottom: 56, right: 12, height: 30 },
  pillPriceText: { fontSize: typography.sizes.small, fontWeight: typography.weights.semibold, color: colors.primary },
  heroScrim: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: "rgba(0,0,0,0.45)" },
  heroTitle: { fontSize: 18, fontWeight: typography.weights.bold, color: colors.white },

  checkBox: { alignItems: "center", gap: spacing.sm, marginBottom: 4 },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  checkTitle: { fontSize: 17, fontWeight: typography.weights.bold, color: colors.text, textAlign: "center" },

  stepper: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  stepperLabel: { fontSize: 14, color: colors.text },
  stepperRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepperQty: { fontSize: 15, fontWeight: typography.weights.bold, color: colors.primary },
  stepperBtns: { fontSize: 15, fontWeight: typography.weights.bold, color: colors.primary },
  stepperBtnsRow: { flexDirection: "row" },
  stepperBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },

  camera: { height: 340, borderRadius: radius.lg, backgroundColor: colors.dark, padding: 16, gap: spacing.md },
  cameraGuide: { flex: 1, borderRadius: radius.md, borderWidth: 2, borderStyle: "dashed", borderColor: colors.white },
  cameraHint: { fontSize: typography.sizes.small, color: "#DDDDDD", textAlign: "center" },
  shutterOuter: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: colors.white, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  shutterInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white },

  logoBox: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  logoMark: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  logoName: { fontSize: 34, fontWeight: typography.weights.bold, color: colors.primary },
  logoTag: { fontSize: typography.sizes.body, color: colors.sub, textAlign: "center", paddingHorizontal: spacing.lg },

  fab: { position: "absolute", right: spacing.md, bottom: spacing.md, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadows.fab },
});
