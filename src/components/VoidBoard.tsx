import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Loader2, Link2, X, Sparkles, BookOpen, Zap, Pencil, Wrench } from 'lucide-react';
import { StickyNote } from './StickyNote';
import { Switch } from '@/components/ui/switch';
import { useNotes, Note } from '@/hooks/useNotes';
import { useConnections } from '@/hooks/useConnections';
import { useReactions } from '@/hooks/useReactions';
import { useAuth } from '@/hooks/useAuth';
import { useVoids } from '@/hooks/useVoids';
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
import { AuthModal } from './AuthModal';
import { CreateVoidModal } from './CreateVoidModal';
import { JoinVoidModal } from './JoinVoidModal';
import { useToast } from '@/hooks/use-toast';
import { AmbientSound } from './AmbientSound';
import { NoteTrail } from './NoteTrail';
import { ConstellationMode } from './ConstellationMode';
import { MoodWeather } from './MoodWeather';
import { VoidSummaryModal } from './VoidSummaryModal';
import { ConnectionSuggestions } from './ConnectionSuggestions';
import { BoardThemePicker, BoardTheme } from './BoardThemePicker';
import { BoardNavigator } from './BoardNavigator';
import { BoardHistorySlider } from './BoardHistorySlider';
import { LiveCursors, getCursorColor } from './LiveCursors';
import { VoidPulse } from './VoidPulse';
import { SyncIndicator } from './SyncIndicator';
import { VoidNavigator } from './VoidNavigator';
import { useVoidNoteCounts } from '@/hooks/useVoidNoteCounts';
import { EquipmentShop } from './EquipmentShop';

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

function VoidBoardContent() {
  const { user, signOut } = useAuth();
  const { voids, createVoid, deleteVoid, joinVoidByCode } = useVoids(user?.id ?? null);
  const { toast } = useToast();
  
  const [currentVoidId, setCurrentVoidId] = useState<string | null>(null);
  const { notes, isLoading, isSyncing, lastSyncTime, addNote, updateNote, deleteNote, setNoteEditing } = useNotes(currentVoidId);
  const { connections, addConnection, removeConnectionsForNote } = useConnections(currentVoidId);
  const noteIds = useMemo(() => notes.map(n => n.id), [notes]);
  const { addReaction, getReactionCounts, hasUserReacted } = useReactions(noteIds);
  const { getPosition } = useNotePositions();
  const { remoteNotes, remotePositions, broadcastTyping, broadcastPosition, broadcastCursor, clearRemoteNote, clearRemotePosition, remoteCursors, sessionId } = useRealtimeTyping(currentVoidId);
  
  // Void Pulse - activity-based background effects
  const { activityLevel, ripples, pulseNoteCreated, pulseReaction, pulseTyping } = useVoidPulse(currentVoidId);
  
  // Broadcast cursor position on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      broadcastCursor(e.clientX, e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [broadcastCursor]);
  
  // Convert cursors for rendering with colors
  const cursorsWithColors = useMemo(() => {
    return remoteCursors.map(cursor => ({
      ...cursor,
      color: getCursorColor(cursor.id),
    }));
  }, [remoteCursors]);
  
  // Zoom and pan
  const { scale, x, y, zoomIn, zoomOut, recenter } = useZoomPan();
  
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
  const [drawingMode, setDrawingMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showEquipmentShop, setShowEquipmentShop] = useState(false);

  // Void note counts for navigator glow
  const voidIds = useMemo(() => voids.map(v => v.id), [voids]);
  const voidNoteCounts = useVoidNoteCounts(voidIds);

  // Show welcome intro for non-signed-in users
  useEffect(() => {
    setShowWelcome(!user);
  }, [user]);
  
  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateVoidModal, setShowCreateVoidModal] = useState(false);
  const [showJoinVoidModal, setShowJoinVoidModal] = useState(false);

  // Handle join code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    
    if (joinCode) {
      // Remove from URL
      window.history.replaceState({}, '', window.location.pathname);
      
      if (user) {
        // Try to join immediately
        handleJoinVoid(joinCode);
      } else {
        // Store for after login
        localStorage.setItem('pending-join-code', joinCode);
        setShowAuthModal(true);
      }
    }
  }, [user]);

  // Check for pending join code after login
  useEffect(() => {
    if (user) {
      const pendingCode = localStorage.getItem('pending-join-code');
      if (pendingCode) {
        localStorage.removeItem('pending-join-code');
        handleJoinVoid(pendingCode);
      }
    }
  }, [user]);

  const handleJoinVoid = async (code: string) => {
    // Extract code from URL if full URL was pasted
    let inviteCode = code;
    if (code.includes('?join=')) {
      inviteCode = code.split('?join=')[1];
    }
    
    const result = await joinVoidByCode(inviteCode);
    if (result.success && result.void) {
      setCurrentVoidId(result.void.id);
      toast({
        title: 'Joined void!',
        description: `You're now in "${result.void.name}"`,
      });
    }
    return result;
  };

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
  const handleAddNote = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const x = Math.random() * (viewportWidth - 300) + 150;
    const y = Math.random() * (viewportHeight - 300) + 150;
    
    addNote();
    pulseNoteCreated(x, y);
  }, [addNote, pulseNoteCreated]);

  const handleNoteDrop = useCallback((
    droppedId: string,
    newPosition: { x: number; y: number }
  ) => {
    updateNote(droppedId, { position: newPosition });
  }, [updateNote]);

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
    const newVoid = await createVoid(name);
    if (newVoid) {
      setCurrentVoidId(newVoid.id);
      toast({
        title: 'Void created!',
        description: `Share code ${newVoid.invite_code} to bring others in.`,
      });
      return newVoid;
    }
    return null;
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
    <div className={`void-board relative ${boardThemeClass}`}>
      {/* Modals */}
      <VoidNavigator
        isOpen={showNavigator}
        onClose={() => setShowNavigator(false)}
        voids={voids}
        currentVoidId={currentVoidId}
        voidNoteCounts={voidNoteCounts}
        onSelectVoid={(id) => {
          setCurrentVoidId(id);
          setShowNavigator(false);
        }}
        user={user}
      />
      <WelcomeIntro visible={showWelcome} onDismiss={handleDismissWelcome} />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {}}
      />
      <CreateVoidModal
        isOpen={showCreateVoidModal}
        onClose={() => setShowCreateVoidModal(false)}
        onSubmit={handleCreateVoid}
      />
      <JoinVoidModal
        isOpen={showJoinVoidModal}
        onClose={() => setShowJoinVoidModal(false)}
        onSubmit={handleJoinVoid}
      />

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

      {/* Drawing Canvas */}
      <DrawingCanvas 
        isActive={drawingMode} 
        onClose={() => setDrawingMode(false)} 
        voidId={currentVoidId}
      />

      {/* Void Pulse - Activity-based background effects */}
      <VoidPulse activityLevel={activityLevel} ripples={ripples} />

      {/* Mood Weather Background */}
      <MoodWeather notes={notes} />

      {/* Constellation Mode - Christmas Stars */}
      <ConstellationMode active={showConstellation} />

      {/* Live Cursors */}
      <LiveCursors cursors={cursorsWithColors} />

      {/* Note Trails */}
      {notes.map(note => {
        const dragState = dragStates[note.id];
        if (!dragState) return null;
        return (
          <NoteTrail
            key={`trail-${note.id}`}
            noteId={note.id}
            isDragging={dragState.isDragging}
            x={dragState.x}
            y={dragState.y}
            rotation={note.rotation}
            color={note.color}
          />
        );
      })}

      {/* Ambient Sound Control */}
      <AmbientSound noteCount={notes.length} />

      {/* Title */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 border-b border-foreground bg-background">
        <div className="flex items-center justify-between">
          <VoidSwitcher
            currentVoidId={currentVoidId}
            voids={voids}
            user={user}
            onSwitchVoid={setCurrentVoidId}
            onCreateVoid={() => setShowCreateVoidModal(true)}
            onDeleteVoid={handleDeleteVoid}
            onJoinVoid={() => setShowJoinVoidModal(true)}
            onSignIn={() => setShowAuthModal(true)}
            onSignOut={signOut}
          />
          <h1 className="text-xl font-bold uppercase tracking-[0.5em] text-center flex-1">
            {currentVoid ? currentVoid.name.toUpperCase() : 'THE MULTIPLAYER VOID'}
          </h1>
          <div className="w-[180px]" /> {/* Spacer for balance */}
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

      {/* Equipment Shop */}
      <EquipmentShop
        isOpen={showEquipmentShop}
        onClose={() => setShowEquipmentShop(false)}
        userId={user?.id ?? null}
        currentVoidId={currentVoidId}
      />

      {/* Board Theme Picker */}
      <div className="fixed top-20 right-4 z-50">
        <BoardThemePicker currentTheme={boardTheme} onThemeSelect={setBoardTheme} />
      </div>

      {/* Drawing mode toggle */}
      <button
        onClick={() => setDrawingMode(!drawingMode)}
        className={`fixed top-32 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground transition-colors ${drawingMode ? 'bg-foreground text-background' : 'bg-background hover:bg-foreground hover:text-background'}`}
        title={drawingMode ? 'Exit drawing mode' : 'Enter drawing mode'}
      >
        <Pencil size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Draw</span>
      </button>

      {/* Constellation mode toggle */}
      <button
        onClick={() => setShowConstellation(!showConstellation)}
        className={`fixed top-44 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground transition-colors ${showConstellation ? 'bg-foreground text-background' : 'bg-background hover:bg-foreground hover:text-background'}`}
        title={showConstellation ? 'Exit stargazing mode' : 'Enter stargazing mode'}
      >
        <Sparkles size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Stars</span>
      </button>

      {/* AI: Void Summary button */}
      <button
        onClick={handleGenerateSummary}
        disabled={isLoadingSummary || notes.length === 0}
        className="fixed top-56 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Generate poetic void summary"
      >
        <BookOpen size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Summary</span>
      </button>

      {/* AI: Suggest Connections button */}
      <button
        onClick={handleSuggestConnections}
        disabled={isLoadingConnections || notes.length < 2}
        className="fixed top-68 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="AI suggests note connections"
      >
        <Zap size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Connect</span>
      </button>

      {/* Equipment Shop button */}
      <button
        onClick={() => user ? setShowEquipmentShop(true) : setShowAuthModal(true)}
        className="fixed top-80 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors"
        title="Equipment Bay"
      >
        <Wrench size={14} />
        <span className="text-xs uppercase tracking-widest font-mono">Equip</span>
      </button>


      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Notes container - z-10 to be above theme backgrounds but below UI controls */}
      <div 
        className="pt-16 min-h-screen relative z-10 viewport-container" 
        style={{
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
        }}
        onClick={connectingFrom ? cancelConnection : undefined}
      >
        {notes.map((note) => {
          const isMatch = noteMatchesSearch(note, searchQuery) && 
            (selectedTags.length === 0 || selectedTags.some(tag => note.tags.includes(tag)));
          const isConnecting = connectingFrom === note.id;
          const isConnectionTarget = connectingFrom !== null && connectingFrom !== note.id;
          
          return (
            <StickyNote
              key={note.id}
              id={note.id}
              initialText={note.text}
              initialPosition={note.position}
              initialRotation={note.rotation}
              initialColor={note.color}
              initialShape={note.shape}
              initialTags={note.tags}
              isLocked={note.is_locked}
              lockedBy={note.locked_by}
              dimmed={(searchQuery.trim() !== '' || selectedTags.length > 0) && !isMatch}
              isConnecting={isConnecting}
              isConnectionTarget={isConnectionTarget}
              reactionCounts={getReactionCounts(note.id)}
              hasUserReacted={(emoji) => hasUserReacted(note.id, emoji)}
              onReact={(emoji) => handleReact(note.id, emoji)}
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
              onTyping={(text, color) => { broadcastTyping(note.id, text, color); pulseTyping(); }}
              onTypingComplete={() => clearRemoteNote(note.id)}
              onPositionChange={(x, y) => broadcastPosition(note.id, x, y)}
              onPositionComplete={() => clearRemotePosition(note.id)}
              onEditingChange={(isEditing) => setNoteEditing(note.id, isEditing)}
            />
          );
        })}

        {/* Empty state */}
        {!isLoading && notes.length === 0 && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <p className="text-lg uppercase tracking-widest mb-2">
                {currentVoid ? 'YOUR VOID IS EMPTY' : 'THE VOID AWAITS'}
              </p>
              <p className="text-sm opacity-50">Click + to spawn a note</p>
            </div>
          </div>
        )}
      </div>

      {/* Spawn button */}
      <button
        onClick={handleAddNote}
        className="btn-spawn"
        title="Spawn new note"
      >
        <Plus size={32} strokeWidth={2} />
      </button>

      {/* Board Navigator is now rendered inside the footer */}

      {/* Board History Slider */}
      <BoardHistorySlider
        voidId={currentVoidId}
        currentNotes={notes}
        onCopyNote={handleCopyFromHistory}
      />

      {/* Sync Indicator */}
      <SyncIndicator isSyncing={isSyncing} lastSyncTime={lastSyncTime} />

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 p-4 text-xs text-muted-foreground uppercase tracking-wider z-[102]">
        <div className="mb-2">
          <BoardNavigator
            zoom={scale}
            onRecenter={recenter}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onOpenNavigator={() => setShowNavigator(true)}
          />
        </div>
        <div>
          Notes: {notes.length} | Connections: {connections.length}
          {user && <span> | {user.email}</span>}
        </div>
      </footer>
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
