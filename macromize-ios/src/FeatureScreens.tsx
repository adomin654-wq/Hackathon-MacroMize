import React, { useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Meal, Targets } from './domain';
import { createImportedMeal, menuLineCandidates, type Activity, type HistoryEntry, type MenuInput } from './activity';
import { pickPhoto, sharePhoto } from './photos';
import { PhotoTextReader } from './PhotoTextReader';

const C = { green: '#173E32', ink: '#101C21', muted: '#6C786A', line: '#E0E7D9', white: '#FFFFFF', soft: '#EDF2E6' };
export function Action({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) { return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={[f.action, secondary && f.secondary, disabled && { opacity: .45 }]}><Text style={[f.actionText, secondary && { color: C.green }]}>{title}</Text></Pressable>; }
export function Field({ label, value, onChangeText, numeric = false, multiline = false, maxLength = 500, placeholder = '' }: { label: string; value: string; onChangeText: (value: string) => void; numeric?: boolean; multiline?: boolean; maxLength?: number; placeholder?: string }) { return <View style={f.field}><Text style={f.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} keyboardType={numeric ? 'decimal-pad' : 'default'} autoCapitalize={numeric ? 'none' : 'sentences'} multiline={multiline} maxLength={maxLength} placeholder={placeholder} placeholderTextColor={C.muted} style={[f.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]} /></View>; }
export function Choice({ values, value, onChange }: { values: string[]; value: string; onChange: (value: string) => void }) { return <View style={f.choices}>{values.map(v => <Pressable key={v} accessibilityRole="radio" accessibilityLabel={v} accessibilityState={{ checked: value === v }} onPress={() => onChange(v)} style={[f.choice, value === v && f.selected]}><Text style={{ color: value === v ? C.white : C.ink, fontFamily:'Avenir Next',fontSize: 13 }}>{v}</Text></Pressable>)}</View>; }
export function AdvancedTargets({ targets, onChange, showMacros=true }: { showMacros?:boolean; targets: Targets; onChange: <K extends keyof Targets>(key: K, value: Targets[K]) => void }) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState({ carbsMax: targets.carbsMax === null ? '' : String(targets.carbsMax), fatMax: targets.fatMax === null ? '' : String(targets.fatMax), budgetMax: targets.budgetMax === null ? '' : String(targets.budgetMax), remainingCalories: targets.remainingCalories === null ? '' : String(targets.remainingCalories) });
  const numeric = (key: 'carbsMax' | 'fatMax' | 'budgetMax' | 'remainingCalories', label: string) => <Field key={key} label={label} numeric value={drafts[key]} onChangeText={v => { setDrafts(current => ({ ...current, [key]: v })); onChange(key, v.trim() ? Number(v.replace(',', '.')) : null); }} />;
  return <View style={f.section}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={f.between}><Text style={f.heading}>More filters & context</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={C.green} /></Pressable>{open && <>
    {numeric('budgetMax', 'Maximum price (€)')}{showMacros&&<>{numeric('carbsMax', 'Carbs maximum (g)')}{numeric('fatMax', 'Fat maximum (g)')}</>}
    <Field label="Cuisine (optional)" value={targets.cuisine === 'Any' ? '' : targets.cuisine} onChangeText={v => onChange('cuisine', v.trim() ? v : 'Any')} placeholder="Any cuisine" maxLength={80} />
    <View style={[f.between, { marginTop: 18 }]}><Text style={f.label}>Open now only</Text><Switch accessibilityLabel="Open now only" value={targets.openNow} onValueChange={v => onChange('openNow', v)} trackColor={{ true: C.green }} /></View><Text style={f.small}>With a filter enabled, meals with unknown price, cuisine, opening status or the selected macro are excluded.</Text>
    {numeric('remainingCalories', 'Calories left today (optional)')}<Field label="Later meal plans (optional)" value={targets.laterMeal} onChangeText={v => onChange('laterMeal', v)} maxLength={160} placeholder="Anything to keep in mind for later" />
    <Text style={f.small}>Daily context stays with your preferences. It does not silently change your meal limits.</Text>
  </>}</View>;
}

export function MenuCapture({ place, mealType, saving, onSave }: { place: { lat: number; lon: number } | null; mealType: Targets['mealType']; saving: boolean; onSave: (meal: Meal) => Promise<boolean> }) {
  const [input, setInput] = useState<MenuInput>({ restaurant: '', name: '', lat: place ? String(place.lat) : '', lon: place ? String(place.lon) : '', sourceUrl: '', sourceText: '', photoUri: null, calories: '', protein: '', carbs: '', fat: '', price: '', cuisine: '', ingredients: '', diet: 'Unknown', mealType });
  const [step, setStep] = useState<'source' | 'dish' | 'review'>('source');
  const [review, setReview] = useState<Meal | null>(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [readProgress, setReadProgress] = useState('');
  const edit = <K extends keyof MenuInput>(key: K, value: MenuInput[K]) => { setInput(current => ({ ...current, [key]: value })); setError(''); };
  async function photo(camera: boolean) { if (picking) return; setPicking(true); try { const uri = await pickPhoto(camera); if (uri) edit('photoUri', uri); } catch (e) { setError(e instanceof Error ? e.message : 'The photo could not be opened.'); } finally { setPicking(false); } }
  function toReview() { try { setReview(createImportedMeal(input)); setStep('review'); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Check the entered information.'); } }
  function next() { if (!input.sourceUrl.trim() && !input.sourceText.trim() && !input.photoUri) { setError('Add an original menu link, its text, or a photo first.'); return; } setStep('dish'); setError(''); }
  return <>
    <Text style={f.body}>Bring a real menu. The dishes you confirm stay on this device and can appear in your matches.</Text>
    <View style={f.progress}><Text style={f.progressText}>{step === 'source' ? '1 · Menu source' : step === 'dish' ? '2 · Dish details' : '3 · Review & confirm'}</Text></View>
    {step === 'source' && <>
      <Field label="Original menu link (optional)" value={input.sourceUrl} onChangeText={v => edit('sourceUrl', v)} maxLength={1000} placeholder="https://" />
      {!!input.sourceUrl.trim() && <Action title="Open original menu" secondary onPress={() => { try { const url = new URL(input.sourceUrl.trim()); if (url.protocol !== 'https:') throw new Error(); void Linking.openURL(url.toString()).catch(() => setError('The link could not be opened.')); } catch { setError('Use an HTTPS link to the restaurant menu.'); } }} />}
      <Field label="Paste menu text (optional)" value={input.sourceText} onChangeText={v => edit('sourceText', v)} maxLength={10000} multiline />
      <View style={f.choices}><View style={{ flex: 1 }}><Action title="Choose menu photo" secondary disabled={picking || readingPhoto} onPress={() => void photo(false)} /></View><View style={{ flex: 1 }}><Action title="Take photo" secondary disabled={picking || readingPhoto} onPress={() => void photo(true)} /></View></View>
      {input.photoUri && <Image source={{ uri: input.photoUri }} accessibilityLabel="Your original menu photo" style={f.photo} resizeMode="contain" />}
      {input.photoUri && <Action title={readingPhoto ? 'Cancel reading photo' : 'Read text from photo'} secondary onPress={() => { setError(''); setReadProgress('Preparing photo…'); setReadingPhoto(!readingPhoto); }} />}
      {readingPhoto && input.photoUri && <><Text style={f.small}>{readProgress}</Text><PhotoTextReader uri={input.photoUri} onProgress={setReadProgress} onRead={text => { edit('sourceText', text); setReadingPhoto(false); setError('Text recognised. Check names and numbers carefully before confirming a dish.'); }} onError={message => { setReadingPhoto(false); setError(message); }} /></>}
      <Text style={f.small}>Photo text recognition runs on this device; the first use downloads recognition files. It can misread names and numbers. Review the text and confirm each dish. Missing nutrition is never filled in automatically.</Text>
      <Action title="Enter a dish from this menu →" disabled={readingPhoto} onPress={next} />
    </>}
    {step === 'dish' && <>
      {input.sourceText.trim() !== '' && <View style={f.card}><Text style={f.heading}>Lines found on your menu</Text><Text style={f.small}>Tap an actual dish line to start. Headers or OCR mistakes may appear too; confirm the correct name and price below.</Text>{menuLineCandidates(input.sourceText).map((line, index) => <Pressable key={`${index}:${line.name}`} accessibilityRole="button" onPress={() => { edit('name', line.name); if (line.price !== null) edit('price', line.price); }} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line }}><Text style={f.body}>{line.name}{line.price !== null ? ` · €${line.price}` : ''}</Text></Pressable>)}</View>}
      <Field label="Restaurant name" value={input.restaurant} onChangeText={v => edit('restaurant', v)} maxLength={200} />
      <Field label="Dish name exactly as listed" value={input.name} onChangeText={v => edit('name', v)} maxLength={200} />
      <Text style={f.small}>Confirm the restaurant’s location. The coordinates below use your searched area as a starting point, if one is selected.</Text>
      <Field label="Restaurant latitude" value={input.lat} onChangeText={v => edit('lat', v)} />
      <Field label="Restaurant longitude" value={input.lon} onChangeText={v => edit('lon', v)} />
      <Text style={f.label}>Meal type</Text><Choice values={['Breakfast', 'Lunch', 'Dinner', 'Snack']} value={input.mealType} onChange={v => edit('mealType', v as Targets['mealType'])} />
      <Field label="Price in EUR (if listed)" value={input.price} numeric onChangeText={v => edit('price', v)} />
      <Field label="Cuisine (if known)" value={input.cuisine} onChangeText={v => edit('cuisine', v)} maxLength={80} />
      <Field label="Listed ingredients, separated by commas" value={input.ingredients} onChangeText={v => edit('ingredients', v)} maxLength={2000} multiline />
      <Text style={f.label}>Dietary label on menu</Text><Choice values={['Unknown', 'Vegetarian', 'Vegan']} value={input.diet} onChange={v => edit('diet', v)} />
      <Text style={[f.heading, { marginTop: 24 }]}>Nutrition from the source</Text><Text style={f.small}>Leave missing values blank. We do not fill them in. Values entered here remain unverified.</Text>
      {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => <Field key={key} label={key === 'calories' ? 'Calories (kcal)' : `${key[0].toUpperCase()}${key.slice(1)} (g)`} value={input[key]} numeric onChangeText={v => edit(key, v)} />)}
      <Action title="Review this dish →" onPress={toReview} /><Action title="Back to source" secondary onPress={() => setStep('source')} />
    </>}
    {step === 'review' && review && <>
      <View style={f.card}><Text style={f.heading}>{review.name}</Text><Text style={f.body}>{review.restaurant}</Text><Text style={f.body}>{review.mealTypes.join(', ')} · {review.price || 'Price unknown'}</Text><Text style={f.body}>{review.lat}, {review.lon}</Text><Text style={f.body}>{review.calories ?? '—'} kcal · {review.protein ?? '—'} g protein</Text><Text style={f.body}>{review.carbs ?? '—'} g carbs · {review.fat ?? '—'} g fat</Text><Text style={f.small}>Source: {review.sourceKind === 'url' ? review.menuUrl : review.sourceKind === 'photo' ? 'Your menu photo' : 'Your pasted menu text'}</Text></View>
      <Text style={f.body}>You confirm this dish is listed on the source menu at this restaurant. It will be labelled “Added by you”. Ingredient completeness, current availability and opening hours remain unknown.</Text>
      <Action title={saving ? 'Saving…' : 'Confirm & find my matches'} disabled={saving} onPress={() => void onSave(review)} /><Action title="Edit details" secondary onPress={() => setStep('dish')} />
    </>}
    {!!error && <Text accessibilityRole="alert" style={f.error}>{error}</Text>}
  </>;
}

export function HistoryScreen({ activity, saving, onUpdate, onRemove, onOpen, onReport }: { activity: Activity; saving: boolean; onUpdate: (id: string, patch: Partial<Pick<HistoryEntry, 'eatenAt' | 'rating' | 'photoUri'>>) => Promise<boolean>; onRemove: (id: string) => Promise<boolean>; onOpen: (meal: Meal) => void; onReport: (meal: Meal) => void }) {
  const [busy, setBusy] = useState(false);
  async function photo(entry: HistoryEntry, camera: boolean) { setBusy(true); try { const uri = await pickPhoto(camera); if (uri) await onUpdate(entry.id, { photoUri: uri }); } catch (e) { Alert.alert('Photo unavailable', e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); } }
  if (!activity.history.length) return <View style={f.card}><Text style={f.heading}>Your next meal starts a story.</Text><Text style={f.body}>Choose a dish to add it here. Mark it as eaten after your meal, then add a photo or a rating.</Text></View>;
  return <>{activity.history.map(entry => <View key={entry.id} style={f.card}>
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${entry.meal.name}`} onPress={() => onOpen(entry.meal)}><Text style={f.heading}>{entry.meal.name}</Text><Text style={f.body}>{entry.meal.restaurant}</Text></Pressable>
    <Text style={f.small}>Chosen {new Date(entry.chosenAt).toLocaleString()} · {entry.eatenAt ? 'Eaten' : 'Not eaten yet'}</Text>
    {!entry.eatenAt ? <Action title="Mark as eaten" disabled={saving} onPress={() => void onUpdate(entry.id, { eatenAt: new Date().toISOString() })} /> : <Action title="Undo eaten status" secondary disabled={saving} onPress={() => void onUpdate(entry.id, { eatenAt: null })} />}
    <Text style={[f.label, { marginTop: 18 }]}>How well did this recommendation fit?</Text><View style={f.choices}>{[1, 2, 3, 4, 5].map(rating => <Pressable key={rating} accessibilityRole="button" accessibilityLabel={`Rate ${rating} of 5`} accessibilityState={{ selected: entry.rating === rating, disabled: saving }} disabled={saving} onPress={() => void onUpdate(entry.id, { rating })} style={f.star}><Ionicons name={entry.rating !== null && entry.rating >= rating ? 'star' : 'star-outline'} size={28} color={C.green} /></Pressable>)}</View>
    {entry.photoUri && <><Image source={{ uri: entry.photoUri }} accessibilityLabel={`Your photo of ${entry.meal.name}`} style={f.photo} /><Action title="Share this photo" secondary onPress={() => void sharePhoto(entry.photoUri!).catch(() => Alert.alert('Sharing unavailable', 'Please try again.'))} /></>}
    <View style={f.choices}><View style={{ flex: 1 }}><Action title={entry.photoUri ? 'Replace photo' : 'Add photo'} secondary disabled={busy || saving} onPress={() => void photo(entry, false)} /></View><View style={{ flex: 1 }}><Action title="Take photo" secondary disabled={busy || saving} onPress={() => void photo(entry, true)} /></View></View>
    <Action title="Report incorrect information" secondary onPress={() => onReport(entry.meal)} />
    <Action title="Remove entry" secondary disabled={saving || busy} onPress={() => Alert.alert('Remove this history entry?', 'This removes this choice, eaten status, rating and its photo copy from MacroMize. Your favourites and original photos stay saved.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove entry', style: 'destructive', onPress: () => void onRemove(entry.id) }])} />
  </View>)}</>;
}

export function ReportScreen({ meal, reports, saving, onSave }: { meal: Meal | null; reports: Activity['reports']; saving: boolean; onSave: (text: string) => Promise<boolean> }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  return <><Text style={f.body}>{meal ? `${meal.name} · ${meal.restaurant}` : 'Something not working, or information that needs correcting?'}</Text><Field label="What should be corrected?" value={text} onChangeText={setText} multiline maxLength={2000} /><Text style={f.small}>Feedback is saved privately on this device. A support delivery service is not connected yet. You can export your feedback from Privacy & data.</Text><Action title="Save feedback on this device" disabled={saving || !text.trim()} onPress={() => { if (!text.trim()) return; void onSave(text.trim()).then(ok => { if (ok) { setText(''); setError('Saved on this device.'); } }); }} />{!!error && <Text accessibilityRole="alert" style={f.error}>{error}</Text>}{reports.length > 0 && <><Text style={[f.heading, { marginTop: 28 }]}>Your saved feedback</Text>{reports.filter(r => !meal || r.mealId === meal.id).map(r => <View key={r.id} style={f.card}><Text style={f.body}>{r.text}</Text><Text style={f.small}>{r.mealName || 'General feedback'} · {new Date(r.createdAt).toLocaleDateString()} · Saved locally</Text></View>)}</>}</>;
}

const f = StyleSheet.create({
  field: { marginTop: 17 }, label: { fontFamily:'Avenir Next',fontSize: 14, color: C.ink, marginBottom: 8 }, input: { minHeight: 50, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 14, color: C.ink, fontFamily:'Avenir Next',fontSize: 15, lineHeight: 22 }, heading: { fontFamily:'Avenir Next',fontSize: 19, lineHeight: 25, color: C.ink, fontWeight: '600', marginBottom: 8 }, body: { fontFamily:'Avenir Next',fontSize: 15, lineHeight: 23, color: C.muted }, small: { fontFamily:'Avenir Next',fontSize: 12, lineHeight: 18, color: C.muted, marginTop: 7 }, section: { marginTop: 26, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.line }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { padding: 13, borderRadius: 11, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }, selected: { backgroundColor: C.green, borderColor: C.green }, action: { backgroundColor: C.green, borderRadius: 13, minHeight: 49, paddingHorizontal: 14, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', marginTop: 14 }, secondary: { backgroundColor: C.soft }, actionText: { color: C.white, fontFamily:'Avenir Next',fontSize: 14, fontWeight: '600', textAlign: 'center' }, card: { backgroundColor: C.white, padding: 18, borderRadius: 17, marginTop: 16 }, progress: { backgroundColor: C.soft, padding: 13, borderRadius: 12, marginTop: 22 }, progressText: { fontFamily:'Avenir Next',fontSize: 14, color: C.green, fontWeight: '600' }, photo: { width: '100%', height: 235, borderRadius: 13, marginTop: 15, backgroundColor: C.soft }, error: { backgroundColor: C.soft, color: C.green, fontFamily:'Avenir Next',fontSize: 14, lineHeight: 21, padding: 14, borderRadius: 12, marginTop: 14 }, star: { minWidth: 43, minHeight: 45, alignItems: 'center', justifyContent: 'center' }
});
