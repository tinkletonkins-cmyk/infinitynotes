import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Link2, X, Wrench, Pencil, Sparkles, BookOpen, Zap } from 'lucide-react';
import { StickyNote } from './StickyNote';
import { useNotes, Note } from '@/hooks/useNotes';
import { useConnections } from '@/hooks/useConnections';
import { useReactions } from '@/hooks/useReactions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLocalVoids } from '@/hooks/useLocalVoids';
import { useVoidAI } from '@/hooks/useVoidAI';
import { useRealtimeTyping } from '@/hooks/useRealtimeTyping';
import { useZoomPan } from '@/hooks/useZoomPan';
import { useVoidPulse } from '@/hooks/useVoidPulse';
import { SearchBar } from './SearchBar';
import { TagsFilter } from './TagsFilter';
import { DrawingCanvas } from './DrawingCanvas';
import { NotePositionsProvider, useNotePositions } from '@/contexts/NotePositionsContext';
import { WelcomeIntro } from './WelcomeIntro';
import { VoidSwitcher } from './VoidSwitcher';
import { useToast } from '@/hooks/use-toast';
import { AmbientSound } from './AmbientSound';
import { ConstellationMode } from './ConstellationMode';
import { MoodWeather } from './MoodWeather';
import { VoidSummaryModal } from './VoidSummaryModal';
import { ConnectionSuggestions } from './ConnectionSuggestions';
import { BoardThemePicker, BoardTheme } from './BoardThemePicker';
import { MiniMap } from './MiniMap';
import { UpdateLog } from './UpdateLog';
import { BoardNavigator } from './BoardNavigator';
import { BoardHistorySlider } from './BoardHistorySlider';
import { LiveCursors, LocalCursor } from './LiveCursors';
import { VoidPulse } from './VoidPulse';
import { SyncIndicator } from './SyncIndicator';
import { EquipmentShop } from './EquipmentShop';
import { useActiveEffects } from '@/hooks/useActiveEffects';
import { EquipmentEffects } from './EquipmentEffects';

const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;
const OVERLAP_THRESHOLD = 150;

function noteMatchesSearch(note: Note, query: string): boolean {
  if (!query.trim()) return true;
  return note.text.toLowerCase().includes(query.toLowerCase());
}

function getRandomPosition(): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  return {
    x: Math.random() * (viewportWidth - 300) + 50,
    y: Math.random() * (viewportHeight - 300) + 100,
  };
}

function getDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}

function pointToLineDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// Wrapper that stabilizes per-note callbacks so StickyNote (React.memo) doesn't re-render unnecessarily
const MemoizedNoteWrapper = React.memo(function MemoizedNoteWrapper({
  note, isConnecting, isConnectionTarget, searchQuery, selectedTags,
  getReactionCounts, hasUserReacted, handleReact, handleDeleteNote,
  handleLockNote, handleUnlockNote, handleUpdateNote, handleNoteDrop,
  handleStartConnection, handleCompleteConnection, handleDragStateChange,
  remoteNotes, remotePositions, broadcastTyping, broadcastPosition,
  clearRemoteNote, clearRemotePosition, setNoteEditing, pulseTyping,
}: any) {
  const isMatch = noteMatchesSearch(note, searchQuery) &&
    (selectedTags.length === 0 || selectedTags.some((tag: string) => note.tags.includes(tag)));
  const dimmed = (searchQuery.trim() !== '' || selectedTags.length > 0) && !isMatch;

  const onReact = useCallback((emoji: string) => handleReact(note.id, emoji), [note.id, handleReact]);
  const onHasUserReacted = useCallback((emoji: string) => hasUserReacted(note.id, emoji), [note.id, hasUserReacted]);
  const onTyping = useCallback((text: string, color: string | null) => {
    broadcastTyping(note.id, text, color);
    pulseTyping();
  }, [note.id, broadcastTyping, pulseTyping]);
  const onTypingComplete = useCallback(() => clearRemoteNote(note.id), [note.id, clearRemoteNote]);
  const onPositionChange = useCallback((x: number, y: number) => broadcastPosition(note.id, x, y), [note.id, broadcastPosition]);
  const onPositionComplete = useCallback(() => clearRemotePosition(note.id), [note.id, clearRemotePosition]);
  const onEditingChange = useCallback((isEditing: boolean) => setNoteEditing(note.id, isEditing), [note.id, setNoteEditing]);

  return (
    <StickyNote
      id={note.id}
      initialText={note.text}
      initialPosition={note.position}
      initialRotation={note.rotation}
      initialColor={note.color}
      initialShape={note.shape}
      initialTags={note.tags}
      isLocked={note.is_locked}
      lockedBy={note.locked_by}
      dimmed={dimmed}
      isConnecting={isConnecting}
      isConnectionTarget={isConnectionTarget}
      reactionCounts={getReactionCounts(note.id)}
      hasUserReacted={onHasUserReacted}
      onReact={onReact}
      onDelete={handleDeleteNote}
      onLock={handleLockNote}
      onUnlock={handleUnlockNote}
      onUpdate={handleUpdateNote}
      onDrop={handleNoteDrop}
      onStartConnection={handleStartConnection}
      onCompleteConnection={handleCompleteConnection}
      onDragStateChange={handleDragStateChange}
      remoteText={remoteNotes[note.id]?.text}
      remoteColor={remoteNotes[note.id]?.color}
      remotePosition={remotePositions[note.id]}
      onTyping={onTyping}
      onTypingComplete={onTypingComplete}
      onPositionChange={onPositionChange}
      onPositionComplete={onPositionComplete}
      onEditingChange={onEditingChange}
    />
  );
});

function VoidBoardContent() {
  const { user, signOut } = useAuth();
  const { voids, createVoid, deleteVoid, addVoid } = useLocalVoids();
  const { toast } = useToast();
  
  const [currentVoidId, setCurrentVoidId] = useState<string | null>(null);
  const { notes, isLoading, isSyncing, lastSyncTime, addNote, updateNote, deleteNote, setNoteEditing, publishNote, discardDraft, draftIds } = useNotes(currentVoidId);
  const { connections, addConnection, removeConnectionsForNote } = useConnections(currentVoidId);
  const noteIds = useMemo(() => notes.map(n => n.id), [notes]);
  const { addReaction, getReactionCounts, hasUserReacted } = useReactions(noteIds);
  const { getPosition } = useNotePositions();
  const { remoteNotes, remotePositions, broadcastTyping, broadcastPosition, broadcastCursor, clearRemoteNote, clearRemotePosition, remoteCursors, cursorPosRef, sessionId } = useRealtimeTyping(currentVoidId);
  
  // Void Pulse - activity-based background effects
  const { activityLevel, ripples, pulseNoteCreated, pulseReaction, pulseTyping } = useVoidPulse(currentVoidId);
  
  // Use a stable fallback so equipment can be used even without a named void
  const DEFAULT_VOID_KEY = '__default__';
  const effectiveVoidId = currentVoidId ?? DEFAULT_VOID_KEY;

  // Active equipment effects for the current void
  const activeEffects = useActiveEffects(user?.id ?? null, effectiveVoidId);
  
  // Broadcast cursor position on mouse move — throttled to ~60ms
  useEffect(() => {
    let lastBroadcast = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastBroadcast < 60) return;
      lastBroadcast = now;
      broadcastCursor(e.clientX, e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [broadcastCursor]);
  
  // Convert cursors for rendering with colors — only recomputes on presence changes, not position
  const cursorsWithColors = useMemo(() => remoteCursors, [remoteCursors]);
  
  // Zoom and pan
  const { scale, x, y, zoomIn, zoomOut, recenter, panTo } = useZoomPan();
  
  // AI features
  const {
    summary,
    isLoadingSummary,
    generateSummary,
    clearSummary,
    connectionSuggestions,
    isLoadingConnections,
    suggestConnections,
    clearSuggestions,
  } = useVoidAI();
  
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('void');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [showConstellation, setShowConstellation] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [dragStates, setDragStates] = useState<Record<string, { isDragging: boolean; x: number; y: number }>>({});
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [canvasMode, setCanvasMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showEquipmentShop, setShowEquipmentShop] = useState(false);
  const [echoArchiveOpen, setEchoArchiveOpen] = useState(false);
  const [showUpdateLog, setShowUpdateLog] = useState(false);
  // Track mouse movement between down and up to distinguish click from drag
  const mouseDownPos = React.useRef<{ x: number; y: number } | null>(null);


  // Show welcome intro for non-signed-in users
  useEffect(() => {
    setShowWelcome(!user);
  }, [user]);

  // gravity_anchor effect: periodically pull connected notes closer
  useEffect(() => {
    if (!activeEffects.has('gravity_anchor') || connections.length === 0) return;
    const interval = setInterval(() => {
      for (const conn of connections) {
        const fromNote = notes.find(n => n.id === conn.from_note_id);
        const toNote = notes.find(n => n.id === conn.to_note_id);
        if (!fromNote || !toNote) continue;
        const dx = toNote.position.x - fromNote.position.x;
        const dy = toNote.position.y - fromNote.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 200 && dist < 800) {
          const pull = 0.02;
          updateNote(toNote.id, {
            position: {
              x: toNote.position.x - dx * pull,
              y: toNote.position.y - dy * pull,
            },
          });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeEffects, connections, notes, updateNote]);

  // resonance_lens effect: auto-suggest connections whenever note count crosses a threshold
  const prevNoteLengthRef = React.useRef(0);
  useEffect(() => {
    if (!activeEffects.has('resonance_lens')) return;
    const prev = prevNoteLengthRef.current;
    prevNoteLengthRef.current = notes.length;
    // Trigger when 5+ notes exist and count has grown since last check
    if (notes.length >= 5 && notes.length > prev && !isLoadingConnections) {
      suggestConnections(notes);
      setShowSuggestionsModal(true);
    }
  }, [activeEffects, notes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // tag_engine effect: auto-tag notes that have no tags yet, watch note IDs to catch new notes
  const noteIdsKey = useMemo(() => notes.map(n => n.id).join(','), [notes]);
  useEffect(() => {
    if (!activeEffects.has('tag_engine')) return;
    const KEYWORD_TAGS: Record<string, string[]> = {
      'idea': ['💡 idea'], 'todo': ['📋 todo'], 'bug': ['🐛 bug'],
      'question': ['❓ question'], 'important': ['⭐ important'],
      'done': ['✅ done'], 'link': ['🔗 link'], 'meeting': ['📅 meeting'],
      'note': ['📝 note'], 'review': ['🔍 review'], 'urgent': ['🚨 urgent'],
    };
    for (const note of notes) {
      if ((note.tags || []).length > 0) continue; // already tagged — don't overwrite
      if (!note.text.trim()) continue;
      const text = note.text.toLowerCase();
      const autoTags: string[] = [];
      for (const [keyword, tags] of Object.entries(KEYWORD_TAGS)) {
        if (text.includes(keyword)) autoTags.push(...tags);
      }
      if (autoTags.length > 0) {
        updateNote(note.id, { tags: autoTags });
      }
    }
  }, [activeEffects, noteIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Track mouse position when connecting
  useEffect(() => {
    if (!connectingFrom) {
      setMousePosition(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingFrom(null);
      }
      // N to add a new note (skip if typing in an input/textarea)
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          handleAddNote();
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [connectingFrom]);

  // Get all unique tags from notes
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      (note.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Filter notes by search and tags
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = noteMatchesSearch(note, searchQuery);
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => (note.tags || []).includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [notes, searchQuery, selectedTags]);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);
  const handleAddNote = useCallback(async () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const nx = Math.random() * (viewportWidth - 300) + 150;
    const ny = Math.random() * (viewportHeight - 300) + 150;
    
    const id = await addNote();
    if (!id) {
      toast({ title: 'Failed to create note', description: 'Could not save to database. Try again.', variant: 'destructive' });
      return;
    }
    pulseNoteCreated(nx, ny);
  }, [addNote, pulseNoteCreated, toast]);

  const handleNoteDrop = useCallback((
    droppedId: string,
    newPosition: { x: number; y: number }
  ) => {
    // memory_grid effect: snap notes to a 40px grid
    if (activeEffects.has('memory_grid')) {
      const GRID = 40;
      newPosition = {
        x: Math.round(newPosition.x / GRID) * GRID,
        y: Math.round(newPosition.y / GRID) * GRID,
      };
    }
    updateNote(droppedId, { position: newPosition });
  }, [updateNote, activeEffects]);

  const handleUpdateNote = useCallback((
    id: string, 
    updates: { text?: string; position?: { x: number; y: number }; color?: string | null; tags?: string[] }
  ) => {
    updateNote(id, updates);
  }, [updateNote]);

  const handleReact = useCallback((noteId: string, emoji: string) => {
    addReaction(noteId, emoji);
    
    // Find note position for ripple effect
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const pos = getPosition(noteId) || note.position;
      pulseReaction(pos.x + 128, pos.y + 64); // Center of note
    }
  }, [addReaction, notes, getPosition, pulseReaction]);

  const handleDeleteNote = useCallback((id: string) => {
    const note = notes.find(n => n.id === id);
    if (note?.is_locked) {
      toast({
        title: 'Note is locked',
        description: 'Unlock the note before deleting.',
        variant: 'destructive',
      });
      return;
    }
    removeConnectionsForNote(id);
    deleteNote(id);
  }, [deleteNote, removeConnectionsForNote, notes, toast]);

  const handleLockNote = useCallback((id: string) => {
    const lockName = user?.email?.split('@')[0] || 'anonymous';
    updateNote(id, { is_locked: true, locked_by: lockName });
    toast({
      title: 'Note locked',
      description: 'This note is now protected from editing.',
    });
  }, [updateNote, user, toast]);

  const handleUnlockNote = useCallback((id: string) => {
    updateNote(id, { is_locked: false, locked_by: null });
    toast({
      title: 'Note unlocked',
      description: 'This note can now be edited.',
    });
  }, [updateNote, toast]);

  const handleCopyFromHistory = useCallback((text: string) => {
    toast({
      title: 'Copied to clipboard',
      description: 'Paste it into a new note to restore.',
    });
  }, [toast]);

  const handleStartConnection = useCallback((noteId: string) => {
    if (connectingFrom === noteId) {
      setConnectingFrom(null);
    } else {
      setConnectingFrom(noteId);
    }
  }, [connectingFrom]);

  const handleCompleteConnection = useCallback(async (targetId: string) => {
    if (!connectingFrom || connectingFrom === targetId) {
      setConnectingFrom(null);
      return;
    }

    const fromPos = getPosition(connectingFrom) || notes.find(n => n.id === connectingFrom)?.position;
    const toPos = getPosition(targetId) || notes.find(n => n.id === targetId)?.position;

    if (!fromPos || !toPos) {
      setConnectingFrom(null);
      return;
    }

    const fromCenter = { x: fromPos.x + NOTE_WIDTH / 2, y: fromPos.y + NOTE_HEIGHT / 2 };
    const toCenter = { x: toPos.x + NOTE_WIDTH / 2, y: toPos.y + NOTE_HEIGHT / 2 };

    const notesToMove = notes.filter(note => {
      if (note.id === connectingFrom || note.id === targetId) return false;
      
      const notePos = getPosition(note.id) || note.position;
      const noteCenter = { x: notePos.x + NOTE_WIDTH / 2, y: notePos.y + NOTE_HEIGHT / 2 };
      
      const distToFrom = getDistance(noteCenter, fromCenter);
      const distToTo = getDistance(noteCenter, toCenter);
      
      if (distToFrom < OVERLAP_THRESHOLD || distToTo < OVERLAP_THRESHOLD) {
        return true;
      }
      
      const distToLine = pointToLineDistance(noteCenter, fromCenter, toCenter);
      if (distToLine < OVERLAP_THRESHOLD) {
        return true;
      }
      
      return false;
    });

    for (const note of notesToMove) {
      let newPos = getRandomPosition();
      let attempts = 0;
      
      while (attempts < 10) {
        const newCenter = { x: newPos.x + NOTE_WIDTH / 2, y: newPos.y + NOTE_HEIGHT / 2 };
        const distToFrom = getDistance(newCenter, fromCenter);
        const distToTo = getDistance(newCenter, toCenter);
        const distToLine = pointToLineDistance(newCenter, fromCenter, toCenter);
        
        if (distToFrom > OVERLAP_THRESHOLD && distToTo > OVERLAP_THRESHOLD && distToLine > OVERLAP_THRESHOLD) {
          break;
        }
        
        newPos = getRandomPosition();
        attempts++;
      }
      
      updateNote(note.id, { position: newPos });
    }

    await addConnection(connectingFrom, targetId);
    setConnectingFrom(null);
  }, [connectingFrom, notes, getPosition, addConnection, updateNote]);

  const cancelConnection = useCallback(() => {
    setConnectingFrom(null);
  }, []);

  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
  }, []);

  const handleDragStateChange = useCallback((noteId: string, isDragging: boolean, x: number, y: number) => {
    setDragStates(prev => ({
      ...prev,
      [noteId]: { isDragging, x, y }
    }));
  }, []);

  const handleCreateVoid = async (name: string) => {
    // Use RPC so both guests and signed-in users can create voids
    const { data, error } = await supabase.rpc('create_guest_void', { _name: name });

    if (error || !data || data.length === 0) {
      console.error('Failed to create void:', error);
      toast({ title: 'Error', description: 'Could not create void. Try again.' });
      return;
    }

    const created = data[0];
    addVoid({ id: created.id, name: created.name, createdAt: Date.now(), inviteCode: created.invite_code ?? '' });
    setCurrentVoidId(created.id);
    toast({ title: 'Void created!', description: `Code: ${created.invite_code} — share it to invite others` });
  };

  const handleDeleteVoid = async (id: string) => {
    if (currentVoidId === id) {
      setCurrentVoidId(null);
    }
    await deleteVoid(id);
    toast({
      title: 'Void deleted',
      description: 'The void and all its notes have been removed.',
    });
  };

  // AI handlers
  const handleGenerateSummary = useCallback(() => {
    setShowSummaryModal(true);
    generateSummary(notes);
  }, [notes, generateSummary]);

  const handleSuggestConnections = useCallback(() => {
    setShowSuggestionsModal(true);
    suggestConnections(notes);
  }, [notes, suggestConnections]);

  const handleAcceptSuggestion = useCallback(async (fromId: string, toId: string) => {
    await addConnection(fromId, toId);
    toast({
      title: 'Connection created!',
      description: 'AI suggestion accepted.',
    });
  }, [addConnection, toast]);

  const currentVoid = currentVoidId ? voids.find(v => v.id === currentVoidId) : null;

  // Build board theme class
  const getThemeClass = () => {
    if (boardTheme === 'board') return 'mode-board';
    if (boardTheme === 'void') return '';
    return `theme-${boardTheme}`;
  };
  const boardThemeClass = getThemeClass();

  return (
    <div
      className={`void-board relative ${boardThemeClass}`}
      onMouseDown={(e) => { mouseDownPos.current = { x: e.clientX, y: e.clientY }; }}
      onClick={(e) => {
        if (connectingFrom) { cancelConnection(); return; }
        // Only fire on the raw board background — ignore clicks on any UI element
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, [class*="absolute"], header, footer, svg')) return;
        const down = mouseDownPos.current;
        if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
        const boardX = (e.clientX - x) / scale;
        const boardY = (e.clientY - y) / scale;
        addNote(undefined, { x: boardX - 105, y: boardY - 80 });
      }}
    >
      {/* Modals */}
      <WelcomeIntro visible={showWelcome} onDismiss={handleDismissWelcome} />

      {/* AI Modals */}
      <VoidSummaryModal
        isOpen={showSummaryModal}
        onClose={() => { setShowSummaryModal(false); clearSummary(); }}
        summary={summary}
        isLoading={isLoadingSummary}
      />
      <ConnectionSuggestions
        isOpen={showSuggestionsModal}
        onClose={() => { setShowSuggestionsModal(false); clearSuggestions(); }}
        suggestions={connectionSuggestions}
        isLoading={isLoadingConnections}
        notes={notes}
        onAccept={handleAcceptSuggestion}
      />

      {/* Drawing Canvas - inline read-only layer */}
      <DrawingCanvas 
        isActive={canvasMode} 
        onClose={() => setCanvasMode(false)} 
        voidId={currentVoidId}
        fullScreen={canvasMode}
      />

      {/* Void Pulse - Activity-based background effects */}
      <VoidPulse activityLevel={activityLevel} ripples={ripples} />

      {/* Mood Weather Background */}
      <MoodWeather notes={notes} />

      {/* Constellation Mode - Christmas Stars */}
      <ConstellationMode active={showConstellation} />

      {/* Equipment Effects - visual layers from installed modules */}
      <EquipmentEffects
        activeEffects={activeEffects}
        notes={notes}
        boardTheme={boardTheme}
        onWarpTo={(nx, ny) => panTo(nx + 128, ny + 100, 1)}
        onOpenEchoArchive={() => setEchoArchiveOpen(true)}
      />

      {/* Live Cursors — remote users */}
      <LiveCursors cursors={cursorsWithColors} posRef={cursorPosRef} />

      {/* Local cursor — same style as remote, tracks instantly */}
      <LocalCursor sessionId={sessionId} />

      {/* Note Trails removed for performance */}

      <UpdateLog isOpen={showUpdateLog} onClose={() => setShowUpdateLog(false)} />

      {/* Ambient Sound Control */}
      <AmbientSound noteCount={notes.length} />

      {/* Updates button — below ambient */}
      <button
        onClick={() => setShowUpdateLog(true)}
        className="fixed top-44 left-4 z-30 flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors"
        title="View update log"
      >
        <span className="text-xs uppercase tracking-widest font-mono">Updates</span>
      </button>

      {/* Title */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 border-b border-foreground bg-background">
        <div className="flex items-center justify-between">
          <VoidSwitcher
            currentVoidId={currentVoidId}
            voids={voids}
            onSwitchVoid={setCurrentVoidId}
            onCreateVoid={handleCreateVoid}
            onDeleteVoid={handleDeleteVoid}
            onJoinVoid={(v) => { addVoid(v); }}
          />
          <h1 className="text-xl font-bold uppercase tracking-[0.5em] text-center flex-1">
            {currentVoid ? currentVoid.name.toUpperCase() : 'THE VOID'}
          </h1>
          <div className="w-[180px]" />
        </div>
      </header>

      {/* Search Bar */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <SearchBar 
          query={searchQuery}
          onQueryChange={setSearchQuery}
          resultCount={filteredNotes.length}
          totalCount={notes.length}
        />
        <TagsFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClearAll={handleClearTags}
        />
      </div>

      {/* Connection Mode Indicator */}
      {connectingFrom && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500 text-yellow-300">
          <Link2 size={16} />
          <span className="text-sm font-mono uppercase tracking-wider">
            Click another note to connect
          </span>
          <button
            onClick={cancelConnection}
            className="ml-2 p-1 hover:bg-yellow-500/30"
            title="Cancel connection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Rubber-band connection line — follows cursor while connecting */}
      {connectingFrom && mousePosition && (() => {
        const fromNote = notes.find(n => n.id === connectingFrom);
        const fromPos = getPosition(connectingFrom) || fromNote?.position;
        if (!fromPos) return null;
        // Center of the source note (approximate)
        const sx = fromPos.x * scale + x + NOTE_WIDTH * scale / 2;
        const sy = fromPos.y * scale + y + NOTE_HEIGHT * scale / 2;
        return (
          <svg
            className="fixed inset-0 pointer-events-none z-40"
            style={{ width: '100vw', height: '100vh' }}
          >
            <line
              x1={sx} y1={sy}
              x2={mousePosition.x} y2={mousePosition.y}
              stroke="hsl(50 100% 60%)"
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
            <circle cx={sx} cy={sy} r={5} fill="hsl(50 100% 60%)" opacity={0.8} />
            <circle cx={mousePosition.x} cy={mousePosition.y} r={4} fill="hsl(50 100% 60%)" opacity={0.6} />
          </svg>
        );
      })()}

      {/* Equipment Shop */}
      <EquipmentShop
        isOpen={showEquipmentShop}
        onClose={() => setShowEquipmentShop(false)}
        userId={user?.id ?? null}
        currentVoidId={effectiveVoidId}
      />

      {/* warp_jump: now rendered inside EquipmentEffects via WarpJumpButton */}

      {/* Right-side buttons — original layout */}
      <div className="fixed top-20 right-4 z-50">
        <BoardThemePicker currentTheme={boardTheme} onThemeSelect={setBoardTheme} />
      </div>

      <button
        onClick={() => setCanvasMode(true)}
        className="fixed top-32 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors"
        title="Enter Drawing Void"
      >
        <Pencil size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Draw</span>
      </button>

      <button
        onClick={() => setShowConstellation(!showConstellation)}
        className={`fixed top-44 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground transition-colors ${showConstellation ? 'bg-foreground text-background' : 'bg-background hover:bg-foreground hover:text-background'}`}
        title={showConstellation ? 'Exit stargazing mode' : 'Enter stargazing mode'}
      >
        <Sparkles size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Stars</span>
      </button>

      <button
        onClick={handleGenerateSummary}
        disabled={isLoadingSummary || notes.length === 0}
        className="fixed top-56 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Generate poetic void summary"
      >
        <BookOpen size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Summary</span>
      </button>

      <button
        onClick={handleSuggestConnections}
        disabled={isLoadingConnections || notes.length < 2}
        className="fixed top-[272px] right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="AI suggests note connections"
      >
        <Zap size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Connect</span>
      </button>


      {isLoading && (
        <div className="pt-16 min-h-screen relative z-10">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="note-skeleton"
              style={{
                left: `${15 + (i % 3) * 28}%`,
                top: `${20 + Math.floor(i / 3) * 35}%`,
                transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (i * 0.7)}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Notes container - z-10 to be above theme backgrounds but below UI controls */}
      <div 
        className="pt-16 min-h-screen relative z-10 viewport-container" 
        style={{
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
        }}
        onMouseDown={(e) => { mouseDownPos.current = { x: e.clientX, y: e.clientY }; }}
        onClick={(e) => {
          if (connectingFrom) { cancelConnection(); return; }
          // Only fire when clicking the board background, not child elements
          if (e.target !== e.currentTarget) return;
          // Ignore if mouse moved more than 4px (was a pan)
          const down = mouseDownPos.current;
          if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
          const boardX = (e.clientX - x) / scale;
          const boardY = (e.clientY - y) / scale;
          addNote(undefined, { x: boardX - 105, y: boardY - 80 });
        }}      >
        {filteredNotes.filter((note) => {
          // Viewport culling: skip notes that are fully off-screen
          const BUFFER = 300; // px buffer to avoid pop-in
          const screenX = note.position.x * scale + x;
          const screenY = note.position.y * scale + y;
          const noteW = NOTE_WIDTH * scale;
          const noteH = NOTE_HEIGHT * scale;
          return (
            screenX + noteW > -BUFFER &&
            screenY + noteH > -BUFFER &&
            screenX < window.innerWidth + BUFFER &&
            screenY < window.innerHeight + BUFFER
          );
        }).map((note) => {
          const isConnecting = connectingFrom === note.id;
          const isConnectionTarget = connectingFrom !== null && connectingFrom !== note.id;
          
          return (
            <MemoizedNoteWrapper
              key={note.id}
              note={note}
              isConnecting={isConnecting}
              isConnectionTarget={isConnectionTarget}
              searchQuery={searchQuery}
              selectedTags={selectedTags}
              getReactionCounts={getReactionCounts}
              hasUserReacted={hasUserReacted}
              handleReact={handleReact}
              handleDeleteNote={handleDeleteNote}
              handleLockNote={handleLockNote}
              handleUnlockNote={handleUnlockNote}
              handleUpdateNote={handleUpdateNote}
              handleNoteDrop={handleNoteDrop}
              handleStartConnection={handleStartConnection}
              handleCompleteConnection={handleCompleteConnection}
              handleDragStateChange={handleDragStateChange}
              remoteNotes={remoteNotes}
              remotePositions={remotePositions}
              broadcastTyping={broadcastTyping}
              broadcastPosition={broadcastPosition}
              clearRemoteNote={clearRemoteNote}
              clearRemotePosition={clearRemotePosition}
              setNoteEditing={setNoteEditing}
              pulseTyping={pulseTyping}
            />
          );
        })}

      </div>

      {/* Empty state — outside the transformed container so it stays centered */}
      {!isLoading && notes.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center text-muted-foreground">
            <p className="text-lg uppercase tracking-widest mb-2">
              {currentVoid ? 'YOUR VOID IS EMPTY' : 'THE VOID AWAITS'}
            </p>
            <p className="text-sm opacity-50">Click + to spawn a note</p>
          </div>
        </div>
      )}

      {/* Spawn button */}
      <button
        onClick={handleAddNote}
        className="btn-spawn"
        title="Spawn new note"
      >
        <Plus size={32} strokeWidth={2} />
      </button>

      {/* Shop button — standalone, sits above the spawn button */}
      <button
        onClick={() => setShowEquipmentShop(true)}
        className="fixed bottom-28 right-8 z-50 flex items-center gap-2 px-4 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors font-mono text-xs uppercase tracking-widest"
        title="Equipment Shop"
      >
        <Wrench size={14} />
        Shop
      </button>

      {/* Board History Slider */}
      <BoardHistorySlider
        voidId={currentVoidId}
        currentNotes={notes}
        onCopyNote={handleCopyFromHistory}
        forceOpen={echoArchiveOpen}
      />

      {/* Sync Indicator */}
      <SyncIndicator isSyncing={isSyncing} lastSyncTime={lastSyncTime} />

      {/* Bottom-left: zoom controls + minimap */}
      <div className="fixed bottom-4 left-4 z-[102] flex flex-col gap-2">
        {/* Zoom controls */}
        <BoardNavigator
          zoom={scale}
          onRecenter={recenter}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
        {/* Minimap */}
        <MiniMap
          notes={notes}
          panX={x}
          panY={y}
          scale={scale}
          onPanTo={(bx, by) => panTo(bx, by, scale)}
        />
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          {notes.length} notes
        </div>
      </div>
    </div>
  );
}

export function VoidBoard() {
  return (
    <NotePositionsProvider>
      <VoidBoardContent />
    </NotePositionsProvider>
  );
}
