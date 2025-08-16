import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Smile, Frown, Meh, Laugh, Angry, Home, LayoutDashboard, BookText, X, PlusCircle, ChevronDown, ChevronUp, MoreVertical, Edit, Trash2, Map, Shield, Zap, Wind, ArrowLeft, Dumbbell, Lock, Star, CheckCircle, ClipboardCheck, Droplets, Sparkles, HeartHandshake } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase and App Initialization ---

// This line securely loads your Firebase configuration from the Vercel environment variables.
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

const appId = 'mindquest-final-deploy'; // A simple, static ID for your app.

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Application Constants ---

// Avatars for user selection during onboarding
const avatars = [
    { id: 1, name: 'Whispering Woods', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1956&auto=format&fit=crop' },
    { id: 2, name: 'Harmony Valley', url: 'https://images.unsplash.com/photo-1509099395498-a26c959ba0b7?q=80&w=1960&auto=format&fit=crop' },
    { id: 3, name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1976&auto=format&fit=crop' },
    { id: 4, name: 'Golden Dunes', url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=2070&auto=format&fit=crop' },
];

// Main goals or paths a user can choose
const goals = [
    { id: 'resilience', name: 'Resilience', description: 'Build strength to navigate life\'s challenges.' },
    { id: 'focus', name: 'Focus', description: 'Sharpen your concentration and be more present.' },
    { id: 'positivity', name: 'Positivity', description: 'Cultivate a more optimistic and grateful outlook.' },
];

// Mood options for daily check-ins
const moods = [
    { value: 5, icon: Laugh, color: '#4ade80', prompt: "Fantastic! What's putting a smile on your face today?", label: 'Fantastic' },
    { value: 4, icon: Smile, color: '#60a5fa', prompt: "Glad to see you're feeling good. Want to write about it?", label: 'Good' },
    { value: 3, icon: Meh, color: '#818cf8', prompt: "Feeling neutral is perfectly okay. What's on your mind?", label: 'Neutral' },
    { value: 2, icon: Frown, color: '#a78bfa', prompt: "It's okay to feel down. What's contributing to this feeling?", label: 'Down' },
    { value: 1, icon: Angry, color: '#f87171', prompt: "It's valid to feel this way. Writing about it might help.", label: 'Angry' },
];

// Data for the nodes on the world map, categorized by path
const mapNodesData = [
    // Resilience Path
    { id: 'r1', name: "Steadfast Stone", path: "resilience", position: { top: '10%', left: '50%' } },
    { id: 'r2', name: "Grit Grove", path: "resilience", position: { top: '25%', left: '30%' } },
    { id: 'r3', name: "Unbending Mountain", path: "resilience", position: { top: '40%', left: '70%' } },
    { id: 'r4', name: "Anchor Point", path: "resilience", position: { top: '55%', left: '40%' } },
    { id: 'r5', name: "The Summit of Self", path: "resilience", position: { top: '70%', left: '60%' } },
    { id: 'r6', name: "Resilient River", path: "resilience", position: { top: '85%', left: '30%' } },
    // Focus Path
    { id: 'f1', name: "Quiet Clearing", path: "focus", position: { top: '10%', left: '50%' } },
    { id: 'f2', name: "Concentration Creek", path: "focus", position: { top: '25%', left: '70%' } },
    { id: 'f3', name: "Mindful Monolith", path: "focus", position: { top: '40%', left: '30%' } },
    { id: 'f4', name: "The Focused Eye", path: "focus", position: { top: '55%', left: '60%' } },
    { id: 'f5', name: "Deep Work Depths", path: "focus", position: { top: '70%', left: '40%' } },
    { id: 'f6', name: "Clarity Peak", path: "focus", position: { top: '85%', left: '70%' } },
    // Positivity Path
    { id: 'p1', name: "Gratitude Gardens", path: "positivity", position: { top: '10%', left: '50%' } },
    { id: 'p2', name: "Sun-Kissed Summit", path: "positivity", position: { top: '25%', left: '30%' } },
    { id: 'p3', name: "Joyful Spring", path: "positivity", position: { top: '40%', left: '70%' } },
    { id: 'p4', name: "Kindness Meadow", path: "positivity", position: { top: '55%', left: '40%' } },
    { id: 'p5', name: "The Optimist's Outlook", path: "positivity", position: { top: '70%', left: '60%' } },
    { id: 'p6', name: "Serenity Shore", path: "positivity", position: { top: '85%', left: '30%' } },
];

// Colors for the connecting lines on the map paths
const lineColors = {
    resilience: "#F87171",
    focus: "#818CF8",
    positivity: "#FBBF24",
};

// Badge definitions and unlock criteria
const badgesList = {
    quests: [
        { id: 'first_quest', name: 'First Quest', description: 'Complete your first Big Quest.', check: (data) => safeArray(data.completedNodes).length >= 1 },
        { id: 'pathfinder', name: 'Pathfinder', description: 'Complete 3 Big Quests.', check: (data) => safeArray(data.completedNodes).length >= 3 },
        { id: 'trailblazer', name: 'Trailblazer', description: 'Complete all nodes on your path.', check: (data) => safeArray(data.completedNodes).filter(n => !n.startsWith('fit')).length >= 6 },
    ],
    journaling: [
        { id: 'scribe', name: 'Scribe', description: 'Write your first journal entry.', check: (data) => safeArray(data.journal).length >= 1 },
        { id: 'diarist', name: 'Diarist', description: 'Write 5 journal entries.', check: (data) => safeArray(data.journal).length >= 5 },
        { id: 'storyteller', name: 'Storyteller', description: 'Write 15 journal entries.', check: (data) => safeArray(data.journal).length >= 15 },
    ],
    consistency: [
        { id: 'week_streak', name: 'Week Streak', description: 'Maintain a 7-day quest streak.', check: (data) => (data.streak || 0) >= 7 },
        { id: 'month_streak', name: 'Month Streak', description: 'Maintain a 30-day quest streak.', check: (data) => (data.streak || 0) >= 30 },
    ],
    fitness: [
        { id: 'first_steps', name: 'First Steps', description: 'Complete your first day of fitness challenges.', check: (data) => data.dailyFitness?.tasks.every(t => t.completed) },
        { id: 'energizer', name: 'Energizer', description: 'Complete fitness challenges 5 times.', check: (data) => (data.fitnessCompletions || 0) >= 5 },
    ]
};
const allBadges = Object.values(badgesList).flat();

// Fallback fitness tasks if AI generation fails
const fitnessTasksPool = {
    level1: ["Complete 5 minutes of gentle, full-body stretching.", "Do 3 minutes of neck, shoulder, and wrist rolls."],
    level2: ["Perform 20 jumping jacks to get your heart rate up.", "Do 15 high knees on each side."],
    level3: ["Go for a 10-minute brisk walk, either outside or in place.", "Complete 3 sets of 10 bodyweight squats."],
    level4: ["Hold a 45-second plank to engage your core.", "Perform 2 sets of 8 push-ups (on knees if needed)."],
    level5: ["Follow a 5-minute cool-down stretch video.", "Practice 3 minutes of deep belly breathing to relax."]
};

// Robust fallback task pool for daily quests
const fallbackTasksPool = {
    resilience: [
        { task: "Take a moment to identify one small thing you can control right now, and tidy it up.", isJournaling: false },
        { task: "Write down a challenge you've overcome in the past. What strength did you show?", isJournaling: true },
        { task: "Think of a time you felt strong. What did that feel like in your body? Try to sit in that feeling for a minute.", isJournaling: false },
    ],
    focus: [
        { task: "For five minutes, put your phone in another room and focus on a single, non-digital task.", isJournaling: false },
        { task: "Describe a place where you feel calm and focused. What makes it that way?", isJournaling: true },
        { task: "Listen to a song without any distractions. Try to pick out one instrument and follow it all the way through.", isJournaling: false },
    ],
    positivity: [
        { task: "Find something in nature—a cloud, a plant, a bird—and watch it for a full minute.", isJournaling: false },
        { task: "Jot down one nice thing someone did for you recently, no matter how small.", isJournaling: true },
        { task: "Send a quick message to a friend simply saying you're thinking of them.", isJournaling: false },
    ]
};

// --- Utility Functions ---

const getMoodProps = (moodValue) => moods.find(m => m.value === moodValue);
const safeArray = (field) => Array.isArray(field) ? field : [];
// A robust, cross-browser compatible function to generate unique IDs.
const generateUniqueId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// --- Contexts and Providers ---

const AuthContext = createContext(null);
const GameContext = createContext(null);

// AuthProvider handles user authentication and data fetching from Firestore.
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const signInUser = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Authentication failed:", error);
                if (!auth.currentUser) {
                    try {
                        await signInAnonymously(auth);
                    } catch (anonError) {
                        console.error("Anonymous sign-in fallback failed:", anonError);
                    }
                }
            }
        };
        signInUser();
        
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            let unsubscribeSnapshot = () => {};
            if (firebaseUser) {
                setUser(firebaseUser);
                const userRef = doc(db, 'artifacts', appId, 'users', firebaseUser.uid);
                
                unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
                    if (userSnap.exists()) {
                        setUserData({ ...userSnap.data(), journal: userSnap.data().journal || [] });
                    } else {
                        setUserData(null);
                    }
                    if (!isAuthReady) setIsAuthReady(true);
                }, (error) => {
                    console.error("Error with Firestore snapshot:", error);
                    if (!isAuthReady) setIsAuthReady(true);
                });
            } else {
                setUser(null);
                setUserData(null);
                if (!isAuthReady) setIsAuthReady(true);
            }
            return () => unsubscribeSnapshot();
        });

        return () => unsubscribeAuth();
    }, [isAuthReady]);

    const value = { user, userData, loading: !isAuthReady };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// GameProvider manages all game logic, state, and interactions.
const GameProvider = ({ children }) => {
    const { user, userData } = useContext(AuthContext);
    const [isTasksLoading, setIsTasksLoading] = useState(true);
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [lastReward, setLastReward] = useState({ xp: 0, newBadges: [] });
    const [journalContext, setJournalContext] = useState({ source: 'quest', mood: null, prompt: '' });
    const [selectedJournalEntry, setSelectedJournalEntry] = useState(null);
    const [entryToEdit, setEntryToEdit] = useState(null);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [unlockedNodeInfo, setUnlockedNodeInfo] = useState(null);
    const [pathToAutoOpen, setPathToAutoOpen] = useState(null);
    const [modalState, setModalState] = useState({
        isJournalOpen: false,
        isJournalDetailOpen: false,
        isDeleteConfirmOpen: false,
        isEditConfirmOpen: false,
        showReward: false,
        showNodeUnlockModal: false,
        showFitnessUnlockModal: false,
        showFitnessCompleteModal: false,
    });

    const openModal = (modalName) => setModalState(prev => ({ ...prev, [modalName]: true }));
    const closeModal = (modalName) => setModalState(prev => ({ ...prev, [modalName]: false }));

    const openJournalDetail = (entry) => {
        setSelectedJournalEntry(entry);
        openModal('isJournalDetailOpen');
    };

    const openNewJournalEntry = () => {
        setEntryToEdit(null);
        setJournalContext({ source: 'journal', mood: null, prompt: 'What\'s on your mind?' });
        openModal('isJournalOpen');
    };
    
    const openEditJournal = (entry) => {
        if (entry.insights) {
            setEntryToEdit(entry);
            openModal('isEditConfirmOpen');
        } else {
            setEntryToEdit(entry);
            setJournalContext({ source: entry.source, mood: entry.mood });
            openModal('isJournalOpen');
        }
    };

    // --- FIX 1: Streamlined the journal edit flow ---
    // This function now closes the detail modal as well, taking the user directly to the edit screen.
    const confirmEditJournal = () => {
        if (!entryToEdit) return;
        setJournalContext({ source: entryToEdit.source, mood: entryToEdit.mood });
        closeModal('isEditConfirmOpen');
        closeModal('isJournalDetailOpen'); // This line was added
        openModal('isJournalOpen');
    };

    const closeJournalModal = () => {
        closeModal('isJournalOpen');
        setEntryToEdit(null);
    };

    const openDeleteConfirm = (entry) => {
        setEntryToDelete(entry);
        openModal('isDeleteConfirmOpen');
    };

    const generateDailyContent = async () => {
        if (!user || !userData) return;
        setIsTasksLoading(true);

        const completedTasksHistory = safeArray(userData.completedTasksHistory).slice(-14);
        const historyPrompt = completedTasksHistory.length > 0
            ? `To ensure variety, avoid generating tasks similar to these recent ones the user has completed:\n${completedTasksHistory.map(t => `- ${t}`).join('\n')}`
            : "This is the user's first day, so provide a welcoming set of tasks.";

        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
        const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
        const contextPrompt = `Today is ${dayOfWeek}, ${today.toISOString().split('T')[0]}. It is a ${isWeekend ? 'weekend' : 'weekday'}.`;

        const prompt = `
            You are MindQuest, a calm and thoughtful companion for the user's wellness journey. Your voice is genuine and encouraging—easygoing and supportive, never forced or overly sentimental. Speak directly to the user as a friendly guide.
            **User's Main Path:** ${userData.mainPath}
            **Today's Context:** ${contextPrompt}
            **User's Recent Task History (avoid repeating these ideas/verbs):**
            ${historyPrompt}
            **Your Mission:**
            Generate a JSON object containing three unique small daily tasks and one larger "Big Quest". Frame these as gentle invitations, not commands.
            **Requirements:**
            1.  **Daily Tasks (3 total):**
                - One for **Resilience**: A small action for emotional strength or coping.
                - One for **Focus**: An idea for clarity, concentration, or presence.
                - One for **Positivity**: A simple way to invite gratitude, kindness, or uplifting perspective.
                - **Exactly one** must be a journaling task. Journaling prompts should feel reflective and open-ended, not cliché.
            2.  **Big Quest (1 total):**
                - A 5–15 minute activity connected to the user's main path (**${userData.mainPath}**). 
                - It should feel like a mini highlight of their day—a creative, exploratory, or meaningful action that goes beyond just “more time spent.”
                - Avoid making it just a longer version of a daily task; instead, give it a slightly different purpose or angle.
            3.  **Tone & Style:**
                - Use warm, easy language. Think invitations like: "Maybe explore…", "How about giving this a try…", "You could take a few minutes for…".
                - Include a subtle “why” behind each task (e.g., “…to steady yourself after a busy day”).
                - Vary the nature of tasks (mental, physical, creative, or social). Avoid overused terms like “mindfully”, “moment”, “center yourself”.
                - Keep tasks concise (1–2 sentences max).
            4.  **Strict Output Format:**
                - Respond ONLY with a valid JSON object. No extra commentary.
            **JSON Structure:**
            {
              "daily_tasks": [
                {"category": "Resilience", "task": "string", "isJournaling": boolean},
                {"category": "Focus", "task": "string", "isJournaling": boolean},
                {"category": "Positivity", "task": "string", "isJournaling": boolean}
              ],
              "big_quest": {
                "path": "${userData.mainPath}",
                "task": "string"
              }
            }
        `;
        
        try {
            const apiUrl = '/api/generateContent';
            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) throw new Error("No text generated from API.");

            let parsedJson;
            try {
                const cleanedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedJson = JSON.parse(cleanedText);
            } catch (e) {
                console.error("Initial JSON parsing failed. Original text:", generatedText);
                throw new Error("Could not parse the JSON response from the AI.");
            }
            
            if (parsedJson && parsedJson.daily_tasks && parsedJson.big_quest) {
                const newTasks = parsedJson.daily_tasks.map((task) => ({ 
                    ...task, 
                    id: generateUniqueId(), 
                    completed: false 
                }));

                const todayStr = new Date().toISOString().split('T')[0];
                const newDailyContent = {
                    date: todayStr,
                    tasks: newTasks,
                    bigQuest: parsedJson.big_quest,
                    allSmallTasksCompleted: false,
                };
                
                const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
                await setDoc(userRef, { dailyContent: newDailyContent }, { merge: true });
            } else {
                throw new Error("Generated JSON is missing required fields.");
            }

        } catch (error) {
            console.error("Failed to generate or process daily content, using fallback:", error);
            toast.error("The spirits are quiet... Here are some challenges.", { duration: 4000 });
            
            // Robust fallback logic
            const resilienceTask = fallbackTasksPool.resilience[Math.floor(Math.random() * fallbackTasksPool.resilience.length)];
            const focusTask = fallbackTasksPool.focus[Math.floor(Math.random() * fallbackTasksPool.focus.length)];
            const positivityTask = fallbackTasksPool.positivity[Math.floor(Math.random() * fallbackTasksPool.positivity.length)];

            // Ensure exactly one is a journaling task
            const potentialJournalTasks = [
                { category: 'Resilience', ...resilienceTask },
                { category: 'Focus', ...focusTask },
                { category: 'Positivity', ...positivityTask },
            ];
            
            let fallbackTasks = [];
            const journalTask = potentialJournalTasks.find(t => t.isJournaling);
            if(journalTask) {
                fallbackTasks.push(journalTask);
                fallbackTasks.push(...potentialJournalTasks.filter(t => !t.isJournaling && t.category !== journalTask.category).slice(0, 2));
            } else {
                 // If no journaling task was picked by chance, force one
                const journalResilience = fallbackTasksPool.resilience.find(t => t.isJournaling);
                fallbackTasks.push({ category: 'Resilience', ...journalResilience });
                fallbackTasks.push({ category: 'Focus', ...focusTask });
                fallbackTasks.push({ category: 'Positivity', ...positivityTask });
                fallbackTasks = fallbackTasks.filter((t, i) => !(t.isJournaling && i > 0)); // Keep only the first journal task
            }

            const fallbackBigQuest = { path: userData.mainPath, task: "Spend 10 minutes organizing or simplifying one part of your digital life (like clearing old files or sorting bookmarks), then note how it felt."};

            const todayStr = new Date().toISOString().split('T')[0];
            const fallbackContent = {
                date: todayStr,
                tasks: fallbackTasks.map(t => ({...t, id: generateUniqueId(), completed: false})),
                bigQuest: fallbackBigQuest,
                allSmallTasksCompleted: false,
            };
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await setDoc(userRef, { dailyContent: fallbackContent }, { merge: true });
        } finally {
            setIsTasksLoading(false);
        }
    };
    
    const generateFallbackFitnessTasks = () => {
        const tasks = Object.keys(fitnessTasksPool).map((levelKey, index) => {
            const pool = fitnessTasksPool[levelKey];
            const randomIndex = Math.floor(Math.random() * pool.length);
            return {
                id: generateUniqueId(),
                text: pool[randomIndex],
                completed: false,
                level: index + 1
            };
        });
        return tasks;
    };
    
    const generateDailyFitnessTasksAI = async () => {
        const prompt = `
            You are a supportive and encouraging fitness guide. Generate a JSON object containing five distinct, short fitness tasks for a user's daily challenge.
            **Requirements:**
            1.  **Five Tasks Total:** Create exactly five tasks.
            2.  **Escalating Intensity:** The tasks must progress logically in intensity:
                - **Level 1:** A very gentle warm-up or mobility exercise (e.g., stretching, neck rolls).
                - **Level 2:** A light cardio warm-up to raise the heart rate (e.g., jumping jacks, high knees).
                - **Level 3:** A moderate main exercise (e.g., brisk walk, bodyweight squats).
                - **Level 4:** A slightly more intense strength or core exercise (e.g., plank, push-ups).
                - **Level 5:** A cool-down or breathing exercise (e.g., cool-down stretches, deep breathing).
            3.  **Clarity & Brevity:** Each task description must be a single, clear, and actionable sentence.
            4.  **Variety:** Do not repeat the exact same exercises every day.
            5.  **Strict Output Format:** Respond ONLY with a valid JSON object. No commentary.
            **JSON Structure:**
            {
              "fitness_tasks": [
                {"level": 1, "task": "string"},
                {"level": 2, "task": "string"},
                {"level": 3, "task": "string"},
                {"level": 4, "task": "string"},
                {"level": 5, "task": "string"}
              ]
            }
        `;

        try {
            const apiUrl = '/api/generateContent';
            const payload = { contents: [{ parts: [{ text: prompt }] }] };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) throw new Error("No text generated from API.");
            
            let parsedJson;
            try {
                const cleanedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedJson = JSON.parse(cleanedText);
            } catch (e) {
                console.error("Initial JSON parsing failed. Original text:", generatedText);
                throw new Error("Could not parse the JSON response from the AI.");
            }
            
            if (parsedJson && parsedJson.fitness_tasks && parsedJson.fitness_tasks.length === 5) {
                const newTasks = parsedJson.fitness_tasks.map((task) => ({ 
                    id: generateUniqueId(),
                    text: task.task,
                    completed: false,
                    level: task.level
                }));
                return newTasks;
            } else {
                throw new Error("Generated JSON for fitness tasks is invalid.");
            }

        } catch (error) {
            console.error("Failed to generate AI fitness tasks, using fallback:", error);
            toast.error("Couldn't generate new exercises, using a classic routine!", { duration: 3000 });
            return generateFallbackFitnessTasks();
        }
    };

    const logWaterIntake = async (isSilent = false) => {
        if (!user || !userData) return;
        const currentLevel = userData.hydration?.level || 0;
        if (currentLevel >= 8) {
            if (!isSilent) {
                toast('You\'ve already reached your goal for today!', { icon: '🎉' });
            }
            return;
        }

        const newLevel = currentLevel + 1;
        let updates = { 'hydration.level': newLevel };
        let xpGained = 0;

        if (newLevel === 8) {
            xpGained = 20;
            const updatedData = addXp(xpGained, userData);
            updates.xp = updatedData.xp;
            updates.level = updatedData.level;
            toast.success('Hydration goal complete! +20 XP');
        }

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, updates);
        } catch (error) {
            console.error("Error logging water intake:", error);
            toast.error("Could not save hydration progress.");
        }
    };

    const handleDailyTasksCompletion = async (tasks) => {
        const allCompleted = tasks.every(t => t.completed);
        if (allCompleted) {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            
            const completedTaskTexts = tasks.map(t => t.task);
            const updatedHistory = [...safeArray(userData.completedTasksHistory), ...completedTaskTexts].slice(-50);

            const userMainPath = userData.mainPath;
            const pathNodes = mapNodesData.filter(node => node.path === userMainPath);
            const currentUnlocked = safeArray(userData.unlockedNodes).filter(nodeId => !nodeId.startsWith('fit'));
            let updatedUnlockedNodes = [...safeArray(userData.unlockedNodes)];

            if (currentUnlocked.length < pathNodes.length) {
                const newlyUnlockedNode = pathNodes[currentUnlocked.length];
                updatedUnlockedNodes = [...updatedUnlockedNodes, newlyUnlockedNode.id];
                setUnlockedNodeInfo({ path: newlyUnlockedNode.path, id: newlyUnlockedNode.id });
                openModal('showNodeUnlockModal');
            }
            
            try {
                await updateDoc(userRef, { 
                    'dailyContent.allSmallTasksCompleted': true,
                    completedTasksHistory: updatedHistory,
                    unlockedNodes: updatedUnlockedNodes
                });
                // Consolidated notification: The NodeUnlockModal is now the primary feedback.
                
                if (userData.hydration?.level < 8) {
                    // This hydration boost is now silent to reduce pop-ups.
                    await logWaterIntake(true);
                }

            } catch (error) {
                console.error("Error updating daily tasks completion:", error);
                toast.error("Could not save your progress. Please try again.");
            }
        }
    };
    
    const getXpForNextLevel = (level) => {
        if (level <= 0) return 0;
        const baseXP = 200;
        const increment = 20;
        return (level / 2) * (2 * baseXP + (level - 1) * increment);
    };

    const addXp = (amount, currentData) => {
        const currentLevel = currentData.level || 1;
        const currentXp = currentData.xp || 0;
        
        const newTotalXp = currentXp + amount;
        let newLevel = currentLevel;
        
        let xpForNext = getXpForNextLevel(newLevel);
        
        while (newTotalXp >= xpForNext) {
            newLevel++;
            xpForNext = getXpForNextLevel(newLevel);
        }

        return { ...currentData, xp: newTotalXp, level: newLevel };
    };
    
    const checkForNewBadges = (currentData) => {
        const currentBadges = safeArray(currentData.badges);
        const newBadges = [];
        allBadges.forEach(badge => {
            if (!currentBadges.includes(badge.id) && badge.check(currentData)) {
                newBadges.push(badge.id);
            }
        });
        return newBadges;
    };

    const completeSimpleTask = async (taskId) => {
        if (!user || !userData || !userData.dailyContent) return;
        
        const updatedTasks = userData.dailyContent.tasks.map(task => 
            task.id === taskId ? { ...task, completed: true } : task
        );
        const updatedDailyContent = { ...userData.dailyContent, tasks: updatedTasks };
        
        let updatedData = { ...userData, dailyContent: updatedDailyContent };
        updatedData = addXp(10, updatedData);

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { 
                dailyContent: updatedDailyContent,
                xp: updatedData.xp,
                level: updatedData.level
            });
            toast.success("Task Complete! +10 XP");
            handleDailyTasksCompletion(updatedTasks);
        } catch (error) {
            console.error("Error completing simple task:", error);
            toast.error("Failed to save task completion.");
        }
    };

    const completeJournalingTask = async (task, journalText) => {
        if (!user || !userData || !userData.dailyContent || !task || !journalText) return;

        const newJournalEntry = { 
            id: generateUniqueId(), date: new Date().toISOString(), entry: journalText, 
            source: 'task', taskText: task.task, path: task.category.toLowerCase()
        };
        const updatedJournal = [newJournalEntry, ...safeArray(userData.journal)];

        const updatedTasks = userData.dailyContent.tasks.map(t => 
            t.id === task.id ? { ...t, completed: true } : t
        );
        const updatedDailyContent = { ...userData.dailyContent, tasks: updatedTasks };
        
        let updatedData = { ...userData, journal: updatedJournal, dailyContent: updatedDailyContent };
        updatedData = addXp(10, updatedData);

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { 
                journal: updatedJournal,
                dailyContent: updatedDailyContent,
                xp: updatedData.xp,
                level: updatedData.level
            });
            toast.success("Journal saved & task complete! +10 XP");
            handleDailyTasksCompletion(updatedTasks);
        } catch (error) {
            console.error("Error completing journaling task:", error);
            toast.error("Failed to save journal and task.");
        }
    };

    const completeNodeTask = async (node) => {
        if(!user || !userData || !userData.dailyContent?.bigQuest) return;
        
        const taskText = userData.dailyContent.bigQuest.task;
        
        let xpGained = 50;
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const newStreak = userData.lastQuestDate === yesterdayStr ? (userData.streak || 0) + 1 : 1;
        
        toast.success("Big Quest Complete! +50XP!");
        if (safeArray(userData.completedNodes).length === 0) {
            openModal('showFitnessUnlockModal');
        }
        
        const newCompletedNodes = [...safeArray(userData.completedNodes), node.id];
        
        const taskKey = `${node.id}-${todayStr}`;
        const newCompletedNodeTasks = { ...(userData.completedNodeTasks || {}), [taskKey]: taskText };

        let tempUpdatedData = { ...userData, completedNodes: newCompletedNodes, streak: newStreak };
        const newBadges = checkForNewBadges(tempUpdatedData);
        if (newBadges.length > 0) {
            const badgeBonusXp = newBadges.length * 25;
            xpGained += badgeBonusXp;
            toast.success(`Badge Unlocked! +${badgeBonusXp} bonus XP!`);
        }
        
        const updatedData = addXp(xpGained, tempUpdatedData);
        const updatedBadges = newBadges.length > 0 ? [...new Set([...safeArray(userData.badges), ...newBadges])] : userData.badges;

        if(xpGained > 0 || newBadges.length > 0) {
            setLastReward({ xp: xpGained, newBadges: newBadges.map(id => allBadges.find(b => b.id === id).name) });
            openModal('showReward');
        }

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { 
                xp: updatedData.xp, 
                level: updatedData.level, 
                completedNodes: newCompletedNodes,
                completedNodeTasks: newCompletedNodeTasks,
                streak: newStreak,
                lastQuestDate: todayStr,
                badges: updatedBadges,
            });
        } catch (error) {
            console.error("Error completing node task:", error);
            toast.error("Failed to save quest progress.");
        }
    };

    const recordMood = async (moodValue) => {
        if (!user || !userData) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const moodAlreadyLoggedToday = userData.lastMoodDate === todayStr;
        let updates = {};
        let xpGained = 0;

        if (!moodAlreadyLoggedToday) {
            xpGained = 5;
            const updatedData = addXp(xpGained, userData);
            updates.xp = updatedData.xp;
            updates.level = updatedData.level;
            updates.lastMoodDate = todayStr;
            toast.success('+5 XP for your check-in!', { duration: 3000 });
        }

        const moodProps = getMoodProps(moodValue);
        const openJournal = () => {
            setJournalContext({ source: 'mood', mood: moodValue, prompt: moodProps.prompt });
            openModal('isJournalOpen');
        };
        toast.custom((t) => (
            <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} style={{maxWidth: '28rem', width: '100%', backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: '0.5rem', pointerEvents: 'auto', display: 'flex', ring: '1px solid rgba(0, 0, 0, 0.05)'}}>
                <div style={{flex: '1 1 0%', width: '0', padding: '1rem'}}><p style={{fontSize: '0.875rem', fontWeight: '500', color: '#1f2937'}}>{moodProps.prompt}</p></div>
                <div style={{display: 'flex', borderLeft: '1px solid #e5e7eb'}}><button onClick={() => {toast.dismiss(t.id); openJournal();}} style={{width: '100%', border: '1px solid transparent', borderRadius: '0', borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#4f46e5', cursor: 'pointer'}}>Journal</button></div>
            </motion.div>), {id: `mood-toast-${moodValue}`});
        
        let moodHistory = [...safeArray(userData.moodHistory)];
        const todayEntryIndex = moodHistory.findIndex(entry => entry.date.startsWith(todayStr));
        if (todayEntryIndex > -1) {
            moodHistory[todayEntryIndex] = { ...moodHistory[todayEntryIndex], mood: moodValue };
        } else {
            moodHistory.unshift({ date: new Date().toISOString(), mood: moodValue });
        }
        moodHistory.sort((a,b) => new Date(b.date) - new Date(a.date));
        updates.moodHistory = moodHistory.slice(0, 30);
        
        const newBadges = checkForNewBadges({ ...userData, ...updates });
        if(newBadges.length > 0) {
            updates.badges = [...new Set([...safeArray(userData.badges), ...newBadges])];
        }
        if (xpGained > 0 || newBadges.length > 0) {
            setLastReward({ xp: xpGained, newBadges: newBadges.map(id => allBadges.find(b => b.id === id).name) });
            openModal('showReward');
        }
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, updates);
            checkLowMoodPattern(updates.moodHistory);
        } catch (error) {
            console.error("Error recording mood:", error);
            toast.error("Could not save your mood.");
        }
    };
    
    const checkLowMoodPattern = async (moodHistory) => {
        if (!moodHistory || moodHistory.length < 3) return;

        const lastSupportDate = userData.lastSupportMessageDate;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (lastSupportDate && new Date(lastSupportDate) > sevenDaysAgo) {
            return; // Don't show the message if it was shown recently.
        }

        const recentEntries = moodHistory.slice(0, 3);
        const uniqueDays = new Set(recentEntries.map(e => e.date.split('T')[0]));

        const isLowMood = (mood) => mood <= 2; // Angry or Down
        const allRecentMoodsAreLow = recentEntries.every(e => isLowMood(e.mood));

        if (allRecentMoodsAreLow && uniqueDays.size >= 3) {
            toast.custom((t) => (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    style={{
                        maxWidth: '24rem', width: '100%', backgroundColor: '#374151', color: 'white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        borderRadius: '0.75rem', pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', padding: '1rem', gap: '1rem'
                    }}
                >
                    <HeartHandshake size={24} style={{ color: '#a78bfa', flexShrink: 0, marginTop: '0.25rem' }} />
                    <div style={{ flexGrow: 1 }}>
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>You're Not Alone</p>
                        <p style={{ fontSize: '0.875rem', color: '#d1d5db', marginBottom: '0.75rem' }}>
                            It looks like things have been tough lately. If talking to someone could help, here are some resources.
                        </p>
                        <a href="https://www.who.int/health-topics/mental-health" target="_blank" rel="noopener noreferrer" style={{ color: '#c4b5fd', fontWeight: 'bold', textDecoration: 'underline' }}>
                            Find Support
                        </a>
                    </div>
                    <button onClick={() => toast.dismiss(t.id)} style={{ background: 'none', border: 'none', color: '#9ca3af' }}>
                        <X size={20} />
                    </button>
                </motion.div>
            ), { id: 'support-toast', duration: Infinity });

            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { lastSupportMessageDate: new Date().toISOString() });
        }
    };

    const saveJournalEntry = async (entry, context) => {
        if (!user || !userData || !entry.trim()) {
            toast.error("Journal entry cannot be empty.");
            return;
        }
        const newJournalEntry = { id: generateUniqueId(), date: new Date().toISOString(), entry, source: context.source };
        if (context.source === 'mood') {
            newJournalEntry.mood = context.mood;
        }
        const updatedJournal = [newJournalEntry, ...safeArray(userData.journal)];
        let updates = { journal: updatedJournal };

        let tempUpdatedData = { ...userData, journal: updatedJournal };
        const newBadges = checkForNewBadges(tempUpdatedData);
        let xpGained = 0;
        if (newBadges.length > 0) {
            const badgeBonusXp = newBadges.length * 25;
            xpGained += badgeBonusXp;
            toast.success(`Badge Unlocked! +${badgeBonusXp} bonus XP!`);
            updates.badges = [...new Set([...safeArray(userData.badges), ...newBadges])];
        }

        if (xpGained > 0) {
            const updatedData = addXp(xpGained, userData);
            updates.xp = updatedData.xp;
            updates.level = updatedData.level;
        }

        if (xpGained > 0 || newBadges.length > 0) {
            setLastReward({ xp: xpGained, newBadges: newBadges.map(id => allBadges.find(b => b.id === id).name) });
            openModal('showReward');
        }

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, updates);
            closeJournalModal();
            toast.success("Your thoughts have been saved.");
        } catch (error) {
            console.error("Error saving journal entry:", error);
            toast.error("Failed to save your journal entry.");
        }
    };

    const updateJournalEntry = async (entryId, newText) => {
        if (!user || !userData || !newText.trim()) {
            toast.error("Journal entry cannot be empty.");
            return;
        }
        const updatedJournal = safeArray(userData.journal).map(entry =>
            entry.id === entryId ? { ...entry, entry: newText, date: new Date().toISOString(), insights: null } : entry
        );
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { journal: updatedJournal });
            toast.success("Journal entry updated!");
            closeJournalModal();
        } catch (error) {
            console.error("Error updating journal entry:", error);
            toast.error("Failed to update journal entry.");
        }
    };

    const deleteJournalEntry = async () => {
        if (!user || !userData || !entryToDelete) return;
        const updatedJournal = safeArray(userData.journal).filter(entry => entry.id !== entryToDelete.id);
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { journal: updatedJournal });
            toast.error("Journal entry deleted.");
            closeModal('isDeleteConfirmOpen');
            if (selectedJournalEntry?.id === entryToDelete.id) {
                closeModal('isJournalDetailOpen');
            }
            setEntryToDelete(null);
        } catch (error) {
            console.error("Error deleting journal entry:", error);
            toast.error("Failed to delete journal entry.");
        }
    };
    
    const completeFitnessTask = async (taskId) => {
        if (!user || !userData || !userData.dailyFitness) return;

        const updatedTasks = userData.dailyFitness.tasks.map(task =>
            task.id === taskId ? { ...task, completed: true } : task
        );
        const updatedFitnessData = { ...userData.dailyFitness, tasks: updatedTasks };

        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { dailyFitness: updatedFitnessData });
            toast.success("Great work!", { duration: 2000 });
        } catch (error) {
            console.error("Error completing fitness task:", error);
            toast.error("Failed to save fitness progress.");
            return;
        }

        const allCompleted = updatedTasks.every(t => t.completed);
        if (allCompleted) {
            let xpGained = 25;
            const newFitnessCompletions = (userData.fitnessCompletions || 0) + 1;
            
            let tempUpdatedData = { ...userData, fitnessCompletions: newFitnessCompletions, dailyFitness: updatedFitnessData };
            const newBadges = checkForNewBadges(tempUpdatedData);
            if (newBadges.length > 0) {
                const badgeBonusXp = newBadges.length * 25;
                xpGained += badgeBonusXp;
                toast.success(`Badge Unlocked! +${badgeBonusXp} bonus XP!`);
            }

            const updatedData = addXp(xpGained, userData);
            const updatedBadges = newBadges.length > 0 ? [...new Set([...safeArray(userData.badges), ...newBadges])] : userData.badges;

            try {
                const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
                await updateDoc(userRef, { 
                    xp: updatedData.xp, 
                    level: updatedData.level,
                    fitnessCompletions: newFitnessCompletions,
                    badges: updatedBadges
                });
                setLastReward({ xp: xpGained, newBadges: newBadges.map(id => allBadges.find(b => b.id === id).name) });
                openModal('showFitnessCompleteModal');
            } catch (error) {
                console.error("Error finalizing fitness completion:", error);
                toast.error("Failed to save final fitness rewards.");
            }
        }
    };
    
    const generateJournalInsights = async (journalEntry) => {
        if (!user || !userData) return;
        setIsInsightLoading(true);
        const toastId = toast.loading('Finding insights...');

        const prompt = `
            You are a warm, supportive, and insightful companion. A user has shared a journal entry with you. Your task is to offer a gentle, encouraging response.
            **Your Persona:**
            - You are NOT a therapist, doctor, or life coach.
            - Your tone is warm, easygoing, and non-judgmental, like a kind friend listening.
            - Speak in short, natural paragraphs.
            **Your Instructions:**
            1. **Read the Entry:** Carefully read the user's journal entry provided below.
            2. **Identify Key Themes:** Notice feelings, topics, or recurring ideas. Are they talking about challenges, gratitude, stress, joy, or uncertainty?
            3. **Reflect First:** Always begin by acknowledging and reflecting their feelings. Use phrases like: "It sounds like...", "I'm hearing that...", or "It takes courage to notice..."
            4. **Offer Gentle Ideas (Only If Invited):** - If the entry expresses uncertainty or feeling stuck (e.g., “I’m not sure what to do” or “I feel lost”), you may gently share **one simple, everyday idea** (like taking a break, journaling more, or doing something enjoyable).  
               - Present ideas as optional invitations, not instructions or solutions. Use phrasing like: *"You could try..."*, *"Maybe it might help to..."*, *"Some people find..."*.  
               - **NEVER** give medical, therapeutic, financial, or life-altering advice.
            5. **Find a Positive:** Highlight one strength, thoughtful observation, or effort they’ve shown.
            6. **Keep it Concise:** 2–3 short paragraphs.
            7. **Handle Unclear Input:**
               - If the entry is very short but seems to contain a real thought or feeling, respond with: "It looks like these thoughts are still taking shape. Journaling is a great space to explore them. Feel free to write more when you’re ready, and I'll be here to reflect with you."
               - If it’s nonsensical (e.g., 'asdfasdfasdf'), or contains no discernible meaning, respond with: "It looks like there might have been a slip of the fingers here! Whenever you’re ready to share your thoughts, I’m ready to listen."
            **User's Journal Entry:**
            ---
            ${journalEntry.entry}
            ---
        `;

        try {
            const apiUrl = '/api/generateContent';
            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            const insightText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!insightText) throw new Error("No insight generated.");
            const updatedJournal = safeArray(userData.journal).map(entry =>
                entry.id === journalEntry.id ? { ...entry, insights: insightText } : entry
            );

            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await updateDoc(userRef, { journal: updatedJournal });
            
            const updatedEntry = updatedJournal.find(e => e.id === journalEntry.id);
            if(updatedEntry) {
                openJournalDetail(updatedEntry);
            }

            toast.success('Insight revealed!', { id: toastId });

        } catch (error) {
            console.error("Failed to generate journal insights:", error);
            toast.error("The spirits of insight are quiet right now. Please try again later.", { id: toastId });
        } finally {
            setIsInsightLoading(false);
        }
    };

    useEffect(() => {
        const setupDailyData = async () => {
            if (userData && user) {
                const todayStr = new Date().toISOString().split('T')[0];
                const userContentData = userData.dailyContent;
                const userFitnessData = userData.dailyFitness;

                if (!userContentData || userContentData.date !== todayStr) {
                    await generateDailyContent();
                } else {
                    setIsTasksLoading(false);
                }

                if (!userFitnessData || userFitnessData.date !== todayStr) {
                    const newFitnessTasks = await generateDailyFitnessTasksAI();
                    const newFitnessData = { date: todayStr, tasks: newFitnessTasks };
                    const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
                    await setDoc(userRef, { dailyFitness: newFitnessData }, { merge: true });
                }
            }
        };
        setupDailyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userData?.mainPath]); 
    
    useEffect(() => {
        const checkHydrationReset = async () => {
            if (user && userData) {
                const todayStr = new Date().toISOString().split('T')[0];
                const lastLog = userData.hydration?.lastLogDate;

                if (lastLog !== todayStr) {
                    try {
                        const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
                        await updateDoc(userRef, {
                            'hydration.level': 0,
                            'hydration.lastLogDate': todayStr
                        });
                    } catch (error) {
                        console.error("Error resetting hydration:", error);
                    }
                }
            }
        };
        checkHydrationReset();
    }, [user, userData]);

    useEffect(() => {
        if (!user || !userData || !userData.hydration) return;

        const hydrationLevel = userData.hydration.level || 0;
        if (hydrationLevel >= 8) {
            return;
        }

        const twoHours = 2 * 60 * 60 * 1000;
        const timerId = setTimeout(() => {
            toast("Friendly reminder to drink some water!", { icon: '💧' });
        }, twoHours);

        return () => clearTimeout(timerId);

    }, [user, userData, userData?.hydration?.level]);

    const value = { 
        modalState, openModal, closeModal,
        lastReward, recordMood, 
        journalContext, saveJournalEntry, openJournalDetail, 
        selectedJournalEntry, openNewJournalEntry, isTasksLoading, isInsightLoading,
        entryToEdit, openEditJournal, confirmEditJournal, closeJournalModal, updateJournalEntry, 
        entryToDelete, openDeleteConfirm, deleteJournalEntry, 
        unlockedNodeInfo, setUnlockedNodeInfo, pathToAutoOpen, setPathToAutoOpen, userData, 
        completeSimpleTask, completeJournalingTask, completeNodeTask,
        completeFitnessTask, getXpForNextLevel,
        logWaterIntake, generateJournalInsights
    };
    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// --- Custom Hooks ---
const useAuth = () => useContext(AuthContext);
const useGame = () => useContext(GameContext);

// --- UI Components ---

// Onboarding component for new users.
const Onboarding = () => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [displayName, setDisplayName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
    const [selectedGoal, setSelectedGoal] = useState(goals[0]);

    const handleComplete = async () => {
        if (!user || !displayName.trim()) {
            toast.error("Please enter a name to begin your journey.");
            return;
        }
        const initialData = {
            displayName: displayName.trim(),
            avatarUrl: selectedAvatar.url,
            mainPath: selectedGoal.id,
            level: 1,
            xp: 0,
            streak: 0,
            lastQuestDate: null,
            lastMoodDate: null,
            lastSupportMessageDate: null,
            journal: [],
            moodHistory: [],
            completedNodes: [],
            unlockedNodes: [],
            badges: [],
            completedTasksHistory: [],
            fitnessCompletions: 0,
            hydration: { level: 0, lastLogDate: null }
        };
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await setDoc(userRef, initialData);
            toast.success("Your journey begins!");
        } catch (error) {
            console.error("Failed to save initial user data:", error);
            toast.error("Could not start your journey. Please try again.");
        }
    };

    const handleNameSubmit = (e) => {
        if (e.key === 'Enter' && displayName.trim()) {
            e.preventDefault();
            setStep(2);
        }
    };
    
    // --- FIX 2: Added validation to prevent moving to the next step with a blank name ---
    const handleNextStep = () => {
        if (step === 1 && !displayName.trim()) {
            toast.error("Please enter a name to continue.");
            return; // Stop the function here if the name is blank
        }
        if (step < 3) {
            setStep(s => s + 1);
        } else {
            handleComplete();
        }
    };

    useEffect(() => {
        const handleGlobalEnter = (e) => {
            if (e.key !== 'Enter') return;
            if (document.activeElement.tagName === 'INPUT') return;

            if (step === 2 && selectedAvatar) { 
                e.preventDefault(); 
                setStep(3); 
            } else if (step === 3 && selectedGoal) {
                e.preventDefault();
                handleComplete();
            }
        };
        window.addEventListener('keydown', handleGlobalEnter);
        return () => window.removeEventListener('keydown', handleGlobalEnter);
    }, [step, selectedAvatar, selectedGoal, handleComplete]);


    const styles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100vw', // Fix: Ensure full width
            background: 'linear-gradient(to bottom right, #111827, #1e3a8a, #4f46e5)',
            padding: '1rem',
            color: 'white',
            boxSizing: 'border-box',
        },
        card: {
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            width: '100%',
            maxWidth: '32rem',
            textAlign: 'center',
        },
        title: {
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#c4b5fd',
            marginBottom: '0.5rem',
        },
        subtitle: {
            color: '#d1d5db',
            marginBottom: '2rem'
        },
        label: {
            display: 'block',
            fontWeight: '600',
            marginBottom: '0.5rem',
            textAlign: 'left'
        },
        input: {
            width: '100%',
            padding: '0.75rem',
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            border: '1px solid #4b5563',
            color: 'white',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            boxSizing: 'border-box',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
        },
        avatarCard: (isSelected) => ({
            cursor: 'pointer',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            border: isSelected ? '3px solid #a78bfa' : '3px solid transparent',
            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s ease-in-out',
        }),
        avatarImage: {
            width: '100%',
            height: '8rem',
            objectFit: 'cover'
        },
        avatarName: {
            padding: '0.5rem',
            backgroundColor: 'rgba(0,0,0,0.5)',
            fontWeight: '600'
        },
        goalCard: (isSelected) => ({
            cursor: 'pointer',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: isSelected ? '2px solid #a78bfa' : '2px solid #4b5563',
            backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
            transition: 'all 0.2s ease-in-out',
            textAlign: 'left'
        }),
        goalName: {
            fontWeight: 'bold',
            fontSize: '1.125rem',
            marginBottom: '0.25rem'
        },
        goalDescription: {
            fontSize: '0.875rem',
            color: '#d1d5db'
        },
        buttonContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '2rem'
        },
        button: {
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: '#8b5cf6',
            color: 'white',
            transition: 'background-color 0.2s',
        },
        backButton: {
            backgroundColor: '#4b5563'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                        {step === 1 && (
                            <div>
                                <h1 style={styles.title}>Welcome, Traveler</h1>
                                <p style={styles.subtitle}>Let's get to know you before we begin our quest.</p>
                                <label htmlFor="displayName" style={styles.label}>What shall we call you?</label>
                                <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} onKeyDown={handleNameSubmit} style={styles.input} placeholder="E.g., Captain Courage" autoFocus/>
                            </div>
                        )}
                        {step === 2 && (
                            <div>
                                <h2 style={styles.title}>Choose Your Realm</h2>
                                <p style={styles.subtitle}>Select a background that resonates with you.</p>
                                <div style={styles.grid}>
                                    {avatars.map(avatar => (
                                        <div key={avatar.id} onClick={() => setSelectedAvatar(avatar)} style={styles.avatarCard(selectedAvatar.id === avatar.id)}>
                                            <img src={avatar.url} alt={avatar.name} style={styles.avatarImage} />
                                            <p style={styles.avatarName}>{avatar.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {step === 3 && (
                            <div>
                                <h2 style={styles.title}>What is Your Primary Goal?</h2>
                                <p style={styles.subtitle}>This will shape the nature of your Big Quests.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {goals.map(goal => (
                                        <div key={goal.id} onClick={() => setSelectedGoal(goal)} style={styles.goalCard(selectedGoal.id === goal.id)}>
                                            <h3 style={styles.goalName}>{goal.name}</h3>
                                            <p style={styles.goalDescription}>{goal.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div style={styles.buttonContainer}>
                            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} style={{...styles.button, ...styles.backButton, opacity: step === 1 ? 0.5 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer'}}>Back</button>
                            {step < 3 ? (
                                <button onClick={handleNextStep} style={styles.button}>Next</button>
                            ) : (
                                <button onClick={handleComplete} style={styles.button}>Begin Journey</button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// Header component displays user info and XP progress.
const Header = () => {
    const { userData } = useAuth();
    const { getXpForNextLevel } = useGame();
    
    const xpData = useMemo(() => {
        if (!userData) return { xpInCurrentLevel: 0, xpNeededForThisLevel: 0, progressPercentage: 0 };
        const level = userData.level || 1;
        const xp = userData.xp || 0;
        const xpForCurrentLevelStart = level > 1 ? getXpForNextLevel(level - 1) : 0;
        const totalXpForNextLevel = getXpForNextLevel(level);
        const xpInCurrentLevel = xp - xpForCurrentLevelStart;
        const xpNeededForThisLevel = totalXpForNextLevel - xpForCurrentLevelStart;
        const progressPercentage = xpNeededForThisLevel > 0 ? (xpInCurrentLevel / xpNeededForThisLevel) * 100 : 0;
        return { xpInCurrentLevel, xpNeededForThisLevel: xpNeededForThisLevel, progressPercentage };
    }, [userData, getXpForNextLevel]);

    if (!userData) return null;

    const { displayName, avatarUrl, level } = userData;

    const styles = {
        header: {
            backgroundColor: 'rgba(17, 24, 39, 0.5)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            padding: '1rem',
        },
        container: {
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
        },
        userInfo: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        avatar: {
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            border: '2px solid #a78bfa',
            objectFit: 'cover',
        },
        xpBarContainer: {
            flexGrow: 1,
            minWidth: '150px',
            maxWidth: '400px'
        },
        xpBar: {
            width: '100%',
            backgroundColor: '#374151',
            borderRadius: '9999px',
            height: '1rem',
            overflow: 'hidden'
        },
        xpBarFill: {
            backgroundImage: 'linear-gradient(to right, #8b5cf6, #6366f1)',
            height: '1rem',
            borderRadius: '9999px',
            transition: 'width 0.5s ease-in-out'
        },
        xpText: {
            fontSize: '0.75rem',
            textAlign: 'center',
            marginTop: '0.25rem',
            color: '#d1d5db',
        },
    };

    return (
        <header style={styles.header}>
            <div style={styles.container}>
                <div style={styles.userInfo}>
                    <img src={avatarUrl} alt={displayName} style={styles.avatar} />
                    <div>
                        <p style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#f9fafb' }}>{displayName}</p>
                        <p style={{ fontSize: '0.875rem', color: '#a78bfa', fontWeight: '600' }}>Level {level}</p>
                    </div>
                </div>
                <div style={styles.xpBarContainer}>
                    <div style={styles.xpBar}>
                        <div style={{...styles.xpBarFill, width: `${xpData.progressPercentage}%` }}></div>
                    </div>
                    <p style={styles.xpText}>{xpData.xpInCurrentLevel} / {xpData.xpNeededForThisLevel} XP</p>
                </div>
            </div>
        </header>
    );
};

// PageWrapper provides a consistent layout with background image and overlay.
const PageWrapper = ({ children, bgImageUrl }) => {
    const styles = {
        pageContainer: {
            position: 'relative',
            minHeight: '100vh',
        },
        background: {
            position: 'fixed',
            inset: 0,
            backgroundImage: `url('${bgImageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        overlay: {
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.3)', // Reduced opacity
            backdropFilter: 'blur(1px)', // Reduced blur
        },
        content: {
            position: 'relative',
            zIndex: 10,
        }
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.background}></div>
            <div style={styles.overlay}></div>
            <div style={styles.content}>
                <Header />
                <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
                    {children}
                    <div style={{ height: '10rem', width: '100%' }} /> {/* Spacer */}
                </main>
            </div>
        </div>
    );
};

// DailyQuestScreen is the main screen showing daily tasks.
const DailyQuestScreen = () => {
    const { userData, isTasksLoading } = useGame();

    const styles = {
        container: {
            maxWidth: '42rem',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
        },
        loadingContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '4rem 2rem',
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderRadius: '0.75rem',
            color: 'white'
        }
    };

    const renderQuestContent = () => {
        if (isTasksLoading || !userData?.dailyContent) {
            return (
                <div style={styles.loadingContainer}>
                    <p style={{fontWeight: '600'}}>The spirits are preparing your daily quests...</p>
                </div>
            );
        }
        
        const allSmallTasksCompleted = userData.dailyContent.allSmallTasksCompleted;
        return allSmallTasksCompleted ? <BigQuestCard /> : <DailyTasksCard />;
    };

    return (
        <PageWrapper bgImageUrl="https://images.unsplash.com/photo-1506744038136-46273834b3fb">
            <div style={styles.container}>
                <MoodSelector />
                <HydrationMeter />
                {renderQuestContent()}
            </div>
        </PageWrapper>
    );
};

// JournalPage displays all the user's journal entries.
const JournalPage = () => {
    const { userData, openJournalDetail, openNewJournalEntry } = useGame();
    // Ensure entries are sorted by date, most recent first.
    const journalEntries = useMemo(() => 
        safeArray(userData.journal).sort((a, b) => new Date(b.date) - new Date(a.date)),
        [userData.journal]
    );

    const styles = {
        container: { maxWidth: '48rem', margin: '0 auto' },
        header: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '2rem', color: 'white'
        },
        title: { fontSize: '1.875rem', fontWeight: 'bold' },
        newEntryButton: {
            backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold',
            padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
        },
        list: { // Changed from grid to list
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
        },
        entryCard: {
            backgroundColor: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(10px)',
            padding: '1.5rem', borderRadius: '0.75rem', color: 'white',
            cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            width: '100%',
            boxSizing: 'border-box',
        },
        entryCardHover: {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.2), 0 4px 6px -2px rgba(139, 92, 246, 0.1)'
        },
        dateContainer: {
             marginBottom: '0.75rem',
        },
        dateText: { 
            fontSize: '0.875rem', 
            color: '#9ca3af', 
            fontWeight: '600'
        },
        timeText: {
            fontSize: '0.75rem',
            color: '#6b7280',
        },
        entrySnippet: {
            color: '#d1d5db',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.6
        },
        noEntries: {
            textAlign: 'center', color: '#9ca3af',
            padding: '4rem 2rem', backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderRadius: '0.75rem'
        }
    };

    const EntryCard = ({ entry }) => {
        const [isHovered, setIsHovered] = useState(false);
        const entryDate = new Date(entry.date);
        const formattedDate = entryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const formattedTime = entryDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        return (
            <div 
                style={{...styles.entryCard, ...(isHovered && styles.entryCardHover)}}
                onClick={() => openJournalDetail(entry)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div style={styles.dateContainer}>
                    <p style={styles.dateText}>{formattedDate}</p>
                    <p style={styles.timeText}>{formattedTime}</p>
                </div>
                <p style={styles.entrySnippet}>{entry.entry}</p>
            </div>
        );
    };

    return (
        <PageWrapper bgImageUrl="https://images.unsplash.com/photo-1637689113621-73951984fcc1?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D">
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>My Journal</h1>
                    <button onClick={openNewJournalEntry} style={styles.newEntryButton}>
                        <PlusCircle size={20} /> New Entry
                    </button>
                </div>
                {journalEntries.length > 0 ? (
                    <div style={styles.list}>
                        {journalEntries.map(entry => <EntryCard key={entry.id} entry={entry} />)}
                    </div>
                ) : (
                    <div style={styles.noEntries}>
                        <p>Your journal is a blank canvas.</p>
                        <p>Start writing to fill it with your thoughts and reflections.</p>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};


// MoodSelector allows users to log their daily mood.
const MoodSelector = () => {
    const { recordMood, userData } = useGame();
    const [selectedMood, setSelectedMood] = useState(null);
    const [hoveredMood, setHoveredMood] = useState(null);

    useEffect(() => {
        if (!userData) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayMood = safeArray(userData.moodHistory).find(m => m.date.startsWith(todayStr));
        setSelectedMood(todayMood ? todayMood.mood : null);
    }, [userData]);
    
    const styles = {
        card: {
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        title: {
            fontSize: '1.25rem',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#f9fafb',
            marginBottom: '1rem',
        },
        container: {
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
        },
        buttonBase: {
            padding: '0.75rem',
            borderRadius: '9999px',
            transition: 'all 0.2s ease-in-out',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'transparent',
        },
        buttonHover: {
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
        },
        buttonSelected: {
            backgroundColor: 'rgba(76, 29, 149, 0.5)',
            outline: '2px solid #a78bfa',
        },
        icon: {
            opacity: 0.7,
        },
        iconSelected: {
            opacity: 1,
        }
    };

    return (
        <div style={styles.card}>
            <h2 style={styles.title}>How are you feeling today?</h2>
            <div style={styles.container}>
                {moods.map(({ value, icon: Icon, color }) => {
                    const isSelected = selectedMood === value;
                    const isHovered = hoveredMood === value;
                    let buttonStyle = {...styles.buttonBase};
                    if (isSelected) {
                        buttonStyle = {...buttonStyle, ...styles.buttonSelected};
                    } else if (isHovered) {
                        buttonStyle = {...buttonStyle, ...styles.buttonHover};
                    }
                    
                    return (
                        <motion.button 
                            key={value} 
                            onClick={() => recordMood(value)} 
                            style={buttonStyle}
                            onMouseEnter={() => setHoveredMood(value)}
                            onMouseLeave={() => setHoveredMood(null)}
                            aria-label={`Mood ${value}`} 
                            whileTap={{ scale: 1.2 }}
                        >
                            <Icon size={40} style={{ color, ...(isSelected ? styles.iconSelected : styles.icon) }} />
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

// HydrationMeter tracks daily water intake.
const HydrationMeter = () => {
    const { userData } = useGame();
    const { logWaterIntake } = useGame();
    const [isHovered, setIsHovered] = useState(false);

    const hydrationLevel = userData?.hydration?.level || 0;
    const fillPercentage = (hydrationLevel / 8) * 100;
    const isComplete = hydrationLevel >= 8;

    const styles = {
        card: {
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            color: '#ffffff',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
        },
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
        title: {
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#f9fafb',
        },
        count: {
            fontWeight: 'bold',
            color: '#67e8f9', // cyan-300
        },
        barContainer: {
            width: '100%',
            backgroundColor: '#374151', // gray-700
            borderRadius: '9999px',
            height: '1.5rem',
            padding: '0.25rem',
            transition: 'all 0.2s',
            cursor: isComplete ? 'not-allowed' : 'pointer',
            boxSizing: 'border-box',
        },
        barContainerHover: {
            outline: '2px solid rgba(56, 189, 248, 0.5)', // ring-2 ring-cyan-400/50
        },
        barInner: {
            position: 'relative',
            width: '100%',
            height: '100%',
        },
        barFill: {
            backgroundImage: 'linear-gradient(to right, #22d3ee, #2563eb)', // from-cyan-400 to-blue-600
            height: '100%',
            borderRadius: '9999px',
            transition: 'width 0.5s ease-out',
        },
        divider: {
            position: 'absolute',
            top: 0,
            height: '100%',
            width: '1px',
            backgroundColor: 'rgba(17, 24, 39, 0.5)', // bg-gray-900/50
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <Droplets size={24} style={{ color: '#22d3ee' }} />
                    <h3 style={styles.title}>Daily Hydration</h3>
                </div>
                <p style={styles.count}>{hydrationLevel} / 8</p>
            </div>
            <div
                style={{...styles.barContainer, ...(isHovered && !isComplete ? styles.barContainerHover : {})}}
                onClick={logWaterIntake}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div style={styles.barInner}>
                    <div
                        style={{ ...styles.barFill, width: `${fillPercentage}%` }}
                    ></div>
                    {[...Array(7)].map((_, i) => (
                        <div key={i} style={{ ...styles.divider, left: `${(i + 1) * 12.5}%` }}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// DailyTasksCard displays the three small daily tasks.
const DailyTasksCard = () => {
    const { userData, completeSimpleTask, completeJournalingTask } = useGame();
    const { tasks } = userData.dailyContent || { tasks: [] };
    const [journalInputs, setJournalInputs] = useState({});

    const handleJournalInputChange = (taskId, value) => {
        setJournalInputs(prev => ({ ...prev, [taskId]: value }));
    };

    const handleJournalSubmit = (task) => {
        const journalText = journalInputs[task.id] || '';
        if (journalText.length >= 10) {
            completeJournalingTask(task, journalText);
        } else {
            toast.error("Journal entry must be at least 10 characters long.");
        }
    };

    const pathStyles = {
        Resilience: { icon: Shield, color: '#f87171', border: 'rgba(239, 68, 68, 0.5)', bg: 'rgba(127, 29, 29, 0.2)' },
        Focus: { icon: Zap, color: '#60a5fa', border: 'rgba(59, 130, 246, 0.5)', bg: 'rgba(30, 58, 138, 0.2)' },
        Positivity: { icon: Wind, color: '#4ade80', border: 'rgba(34, 197, 94, 0.5)', bg: 'rgba(22, 101, 52, 0.2)' },
    };
    
    const styles = {
        card: {
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            color: '#ffffff',
        },
        title: {
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#c4b5fd', // purple-300
            textTransform: 'uppercase',
            marginBottom: '1rem',
            textAlign: 'center',
        },
        tasksContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        },
        taskItem: {
            padding: '1rem',
            borderRadius: '0.5rem',
            borderWidth: '1px',
            borderStyle: 'solid',
            transition: 'all 0.3s',
        },
        taskItemCompleted: {
            opacity: 0.5,
        },
        taskContent: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
        },
        taskText: {
            flexGrow: 1,
        },
        taskDescription: {
            fontWeight: '600',
        },
        taskDescriptionCompleted: {
            textDecoration: 'line-through',
        },
        textarea: {
            width: '100%',
            padding: '0.5rem',
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            border: '1px solid #4b5563',
            color: '#ffffff',
            borderRadius: '0.5rem',
            transition: 'all 0.2s',
            marginTop: '0.5rem',
            boxSizing: 'border-box',
        },
        buttonContainer: {
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '0.5rem',
        },
        button: {
            color: '#ffffff',
            fontWeight: 'bold',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            transition: 'background-color 0.2s',
            border: 'none',
            cursor: 'pointer',
        },
        saveButton: {
            backgroundColor: '#8b5cf6', // purple-600
        },
        saveButtonHover: {
            backgroundColor: '#7c3aed', // purple-700
        },
        saveButtonDisabled: {
            backgroundColor: '#6b7280', // gray-500
            cursor: 'not-allowed',
        },
        completeButton: {
            backgroundColor: '#16a34a', // green-600
        },
        completeButtonHover: {
            backgroundColor: '#15803d', // green-700
        }
    };

    return (
        <div style={styles.card}>
            <h3 style={styles.title}>Your Daily Tasks</h3>
            <div style={styles.tasksContainer}>
                {tasks.map((task) => {
                    const { icon: Icon, color, border, bg } = pathStyles[task.category] || {};
                    const isCompleted = task.completed;
                    const journalText = journalInputs[task.id] || '';

                    return (
                        <div key={task.id} style={{...styles.taskItem, borderColor: border, backgroundColor: bg, ...(isCompleted ? styles.taskItemCompleted : {})}}>
                            <div style={styles.taskContent}>
                                {Icon && <Icon size={24} style={{ color, marginTop: '0.25rem', flexShrink: 0 }} />}
                                <div style={styles.taskText}>
                                    <p style={{...styles.taskDescription, ...(isCompleted ? styles.taskDescriptionCompleted : {})}}>{task.task}</p>
                                    {task.isJournaling && !isCompleted && (
                                        <textarea
                                            value={journalText}
                                            onChange={(e) => handleJournalInputChange(task.id, e.target.value)}
                                            rows="3"
                                            style={styles.textarea}
                                            placeholder="Reflect on your task here..."
                                        />
                                    )}
                                </div>
                                {isCompleted && <ClipboardCheck size={24} style={{ color: '#4ade80', flexShrink: 0 }} />}
                            </div>
                            {!isCompleted && (
                                <div style={styles.buttonContainer}>
                                    {task.isJournaling ? (
                                        <button
                                            onClick={() => handleJournalSubmit(task)}
                                            disabled={journalText.length < 10}
                                            style={{...styles.button, ...styles.saveButton, ...(journalText.length < 10 ? styles.saveButtonDisabled : {})}}
                                        >
                                            Save & Complete
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => completeSimpleTask(task.id)}
                                            style={{...styles.button, ...styles.completeButton}}
                                        >
                                            Complete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// BigQuestCard is shown when all small tasks are complete.
const BigQuestCard = () => {
    const styles = {
        card: {
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '2rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
            color: '#ffffff',
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#4ade80', // green-400
            marginBottom: '0.5rem',
        },
        text: {
            color: '#d1d5db', // gray-300
        }
    };

    return (
        <div style={styles.card}>
            <h2 style={styles.title}>Daily Tasks Complete!</h2>
            <p style={styles.text}>Your Big Quest awaits on the World Map.</p>
        </div>
    );
};

// SimpleConfetti provides a confetti animation for rewards.
const SimpleConfetti = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let { width, height } = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const colors = ['#FFD700', '#a8d5ba', '#d4a5a5', '#a5b4d4', '#8b5cf6'];
        const numParticles = 150;
        let particles = Array.from({ length: numParticles }).map(() => ({
            x: Math.random() * width,
            y: -20 - Math.random() * height,
            w: 10, h: 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: Math.random() * 6 - 3,
            vy: Math.random() * 5 + 2,
            angle: Math.random() * 2 * Math.PI,
            rotationSpeed: Math.random() * 0.1 - 0.05
        }));

        let animationFrameId;

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.angle += p.rotationSpeed;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
                if (p.y > height + 20) {
                    p.x = Math.random() * width;
                    p.y = -20;
                }
            });
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();
        const timeoutId = setTimeout(() => cancelAnimationFrame(animationFrameId), 4000);
        return () => {
            cancelAnimationFrame(animationFrameId);
            clearTimeout(timeoutId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

// RewardModal displays XP and badge rewards.
const RewardModal = ({ onClose }) => {
    const { modalState: { showReward }, lastReward } = useGame();

    const styles = {
        overlay: {
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
        },
        modal: {
            position: 'relative',
            backgroundColor: '#1f2937', // gray-800
            border: '1px solid rgba(167, 139, 250, 0.5)', // border-purple-500/50
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '2rem',
            maxWidth: '24rem',
            width: '100%',
            textAlign: 'center',
            color: 'white',
        },
        title: {
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#c4b5fd', // purple-400
            marginBottom: '0.5rem',
        },
        subtitle: {
            color: '#d1d5db', // gray-300
            marginBottom: '1.5rem',
        },
        xpBox: {
            backgroundColor: 'rgba(55, 65, 81, 0.5)', // gray-700/50
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
        },
        xpText: {
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#ddd6fe', // purple-300
        },
        badgeContainer: {
            marginBottom: '1.5rem',
        },
        badgeTitle: {
            fontWeight: 'bold',
            fontSize: '1.125rem',
            color: '#facc15', // yellow-400
            marginBottom: '0.5rem',
        },
        badge: {
            backgroundColor: '#facc15', // yellow-500
            color: '#422006', // yellow-900
            fontWeight: '600',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            display: 'inline-block',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        },
        button: {
            width: '100%',
            backgroundColor: '#8b5cf6', // purple-600
            color: 'white',
            fontWeight: 'bold',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            transition: 'background-color 0.2s',
            border: 'none',
            cursor: 'pointer',
        },
    };

    return (
        <AnimatePresence>
        {showReward &&
        <div style={styles.overlay}>
            <SimpleConfetti />
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{opacity: 0, scale: 0.7}} style={styles.modal}>
                <h2 style={styles.title}>Well Done!</h2>
                <p style={styles.subtitle}>Your courage shines bright!</p>
                {lastReward.xp > 0 && <div style={styles.xpBox}><p style={styles.xpText}>+{lastReward.xp} XP Gained</p></div>}
                {lastReward.newBadges.length > 0 && (
                    <div style={styles.badgeContainer}>
                        <h3 style={styles.badgeTitle}>Badge Unlocked!</h3>
                        {lastReward.newBadges.map(badge => (
                            <p key={badge} style={styles.badge}> {badge} </p>
                        ))}
                    </div>
                )}
                <button onClick={onClose} style={styles.button}>
                    Continue Journey
                </button>
            </motion.div>
        </div>
        }
        </AnimatePresence>
    );
};

// ... (Other modals and components follow the same CSS-in-JS pattern)
const JournalModal = () => {
    const { modalState, closeJournalModal, journalContext, saveJournalEntry, entryToEdit, updateJournalEntry } = useGame();
    const [text, setText] = useState('');

    useEffect(() => {
        if (entryToEdit) {
            setText(entryToEdit.entry);
        } else {
            setText('');
        }
    }, [entryToEdit, modalState.isJournalOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (entryToEdit) {
            updateJournalEntry(entryToEdit.id, text);
        } else {
            saveJournalEntry(text, journalContext);
        }
    };

    const styles = {
        overlay: {
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        modal: {
            backgroundColor: '#1f2937', color: 'white', borderRadius: '1rem',
            padding: '1.5rem', width: '100%', maxWidth: '36rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #4b5563'
        },
        header: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'
        },
        title: {
            fontSize: '1.25rem', fontWeight: 'bold'
        },
        closeButton: {
            background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer'
        },
        prompt: {
            backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: '1rem', borderRadius: '0.5rem',
            marginBottom: '1rem', fontStyle: 'italic', color: '#d1d5db'
        },
        textarea: {
            width: '100%', height: '16rem', backgroundColor: 'rgba(55, 65, 81, 0.5)',
            border: '1px solid #4b5563', color: 'white', borderRadius: '0.5rem', padding: '0.75rem',
            boxSizing: 'border-box', resize: 'none'
        },
        button: {
            width: '100%', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold',
            padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
            marginTop: '1rem'
        },
        buttonDisabled: {
            backgroundColor: '#6b7280', cursor: 'not-allowed'
        }
    };

    return (
        <AnimatePresence>
            {modalState.isJournalOpen && (
                <div style={styles.overlay}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={styles.modal}>
                        <div style={styles.header}>
                            <h2 style={styles.title}>{entryToEdit ? 'Edit Your Thoughts' : 'New Journal Entry'}</h2>
                            <button onClick={closeJournalModal} style={styles.closeButton}><X size={24} /></button>
                        </div>
                        {journalContext.prompt && <p style={styles.prompt}>{journalContext.prompt}</p>}
                        <form onSubmit={handleSubmit}>
                            <textarea value={text} onChange={(e) => setText(e.target.value)} style={styles.textarea} placeholder="Let your thoughts flow..."></textarea>
                            <button type="submit" disabled={!text.trim()} style={{...styles.button, ...(!text.trim() && styles.buttonDisabled)}}>
                                {entryToEdit ? 'Update Entry' : 'Save Entry'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const JournalDetailModal = () => {
    const { modalState, closeModal, selectedJournalEntry, openEditJournal, openDeleteConfirm, generateJournalInsights, isInsightLoading } = useGame();

    if (!selectedJournalEntry) return null;

    const styles = {
        overlay: {
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        modal: {
            backgroundColor: '#1f2937', color: 'white', borderRadius: '1rem',
            padding: '1.5rem', width: '100%', maxWidth: '36rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #4b5563', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
        },
        header: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0
        },
        date: {
            fontSize: '0.875rem', color: '#9ca3af'
        },
        actions: {
            display: 'flex', gap: '0.5rem'
        },
        actionButton: {
            background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer'
        },
        content: {
            overflowY: 'auto', flexGrow: 1, paddingRight: '0.5rem'
        },
        entryText: {
            whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#d1d5db', marginBottom: '1.5rem'
        },
        insightContainer: {
            borderTop: '1px solid #4b5563', paddingTop: '1.5rem', marginTop: '1.5rem'
        },
        insightHeader: {
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c4b5fd', marginBottom: '0.5rem'
        },
        insightText: {
            whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#d1d5db', fontStyle: 'italic'
        },
        insightButton: {
            width: '100%', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold',
            padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
            marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
        },
        insightButtonDisabled: {
            backgroundColor: '#6b7280', cursor: 'not-allowed'
        }
    };

    return (
        <AnimatePresence>
            {modalState.isJournalDetailOpen && (
                <div style={styles.overlay}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={styles.modal}>
                        <div style={styles.header}>
                            <p style={styles.date}>{new Date(selectedJournalEntry.date).toLocaleString()}</p>
                            <div style={styles.actions}>
                                <button onClick={() => openEditJournal(selectedJournalEntry)} style={styles.actionButton}><Edit size={20} /></button>
                                <button onClick={() => openDeleteConfirm(selectedJournalEntry)} style={styles.actionButton}><Trash2 size={20} /></button>
                                <button onClick={() => closeModal('isJournalDetailOpen')} style={styles.actionButton}><X size={24} /></button>
                            </div>
                        </div>
                        <div style={styles.content}>
                            <p style={styles.entryText}>{selectedJournalEntry.entry}</p>
                            {selectedJournalEntry.insights ? (
                                <div style={styles.insightContainer}>
                                    <h3 style={styles.insightHeader}><Sparkles size={20} /> Insight</h3>
                                    <p style={styles.insightText}>{selectedJournalEntry.insights}</p>
                                </div>
                            ) : (
                                <button onClick={() => generateJournalInsights(selectedJournalEntry)} disabled={isInsightLoading} style={{...styles.insightButton, ...(isInsightLoading && styles.insightButtonDisabled)}}>
                                    {isInsightLoading ? 'Thinking...' : 'Reveal Insight'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    const styles = {
        overlay: {
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        modal: {
            backgroundColor: '#1f2937', color: 'white', borderRadius: '1rem',
            padding: '1.5rem', width: '100%', maxWidth: '24rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #4b5563', textAlign: 'center'
        },
        title: {
            fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem'
        },
        message: {
            color: '#d1d5db', marginBottom: '1.5rem'
        },
        buttonContainer: {
            display: 'flex', gap: '1rem'
        },
        button: {
            flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
            fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s'
        },
        confirmButton: {
            backgroundColor: '#dc2626', color: 'white'
        },
        cancelButton: {
            backgroundColor: '#4b5563', color: 'white'
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={styles.overlay}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={styles.modal}>
                        <h2 style={styles.title}>{title}</h2>
                        <p style={styles.message}>{message}</p>
                        <div style={styles.buttonContainer}>
                            <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Cancel</button>
                            <button onClick={onConfirm} style={{...styles.button, ...styles.confirmButton}}>Confirm</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const NodeUnlockModal = ({ isOpen, onClose, onConfirm }) => {
    const styles = {
        overlay: {
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        modal: {
            backgroundColor: '#1f2937', color: 'white', borderRadius: '1rem',
            padding: '2rem', width: '100%', maxWidth: '28rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #4ade80', textAlign: 'center'
        },
        iconContainer: {
            margin: '0 auto 1rem', width: '4rem', height: '4rem',
            borderRadius: '9999px', backgroundColor: 'rgba(74, 222, 128, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        title: {
            fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '0.5rem'
        },
        message: {
            color: '#d1d5db', marginBottom: '1.5rem'
        },
        buttonContainer: {
            display: 'flex', flexDirection: 'column', gap: '0.5rem'
        },
        button: {
            padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
            fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s'
        },
        confirmButton: {
            backgroundColor: '#22c55e', color: 'white'
        },
        cancelButton: {
            backgroundColor: 'transparent', color: '#9ca3af'
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={styles.overlay}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={styles.modal}>
                        <div style={styles.iconContainer}>
                            <Map size={32} style={{color: '#4ade80'}} />
                        </div>
                        <h2 style={styles.title}>New Quest Unlocked!</h2>
                        <p style={styles.message}>By completing your daily tasks, you've revealed a new location on your path. Visit the World Map to embark on your Big Quest.</p>
                        <div style={styles.buttonContainer}>
                            <button onClick={onConfirm} style={{...styles.button, ...styles.confirmButton}}>Go to Map</button>
                            <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Close</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const FitnessUnlockModal = ({ isOpen, onClose }) => {
    const styles = {
        overlay: {
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        modal: {
            backgroundColor: '#1f2937', color: 'white', borderRadius: '1rem',
            padding: '2rem', width: '100%', maxWidth: '28rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #f97316', textAlign: 'center'
        },
        iconContainer: {
            margin: '0 auto 1rem', width: '4rem', height: '4rem',
            borderRadius: '9999px', backgroundColor: 'rgba(249, 115, 22, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        title: {
            fontSize: '1.5rem', fontWeight: 'bold', color: '#f97316', marginBottom: '0.5rem'
        },
        message: {
            color: '#d1d5db', marginBottom: '1.5rem'
        },
        button: {
            width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
            fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s',
            backgroundColor: '#f97316', color: 'white'
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={styles.overlay}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={styles.modal}>
                        <div style={styles.iconContainer}>
                            <Dumbbell size={32} style={{color: '#f97316'}} />
                        </div>
                        <h2 style={styles.title}>Fitness Hub Unlocked!</h2>
                        <p style={styles.message}>You've completed your first Big Quest! To support your mental journey, the Fitness Hub is now available on your World Map. Check it out for daily physical challenges.</p>
                        <button onClick={onClose} style={styles.button}>Awesome!</button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const FitnessCompleteModal = ({ isOpen, onClose }) => {
    const { lastReward } = useGame();
    const styles = {
        overlay: {
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        modal: {
            position: 'relative',
            backgroundColor: '#1f2937', color: 'white', borderRadius: '1rem',
            padding: '2rem', width: '100%', maxWidth: '28rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #f97316', textAlign: 'center'
        },
        title: {
            fontSize: '1.875rem', fontWeight: 'bold', color: '#fb923c', marginBottom: '0.5rem'
        },
        subtitle: {
            color: '#d1d5db', marginBottom: '1.5rem'
        },
        xpBox: {
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
        },
        xpText: {
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fdba74',
        },
        button: {
            width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
            fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s',
            backgroundColor: '#f97316', color: 'white'
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={styles.overlay}>
                    <SimpleConfetti />
                    <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{opacity: 0, scale: 0.7}} style={styles.modal}>
                        <h2 style={styles.title}>Workout Complete!</h2>
                        <p style={styles.subtitle}>Fantastic effort! Your body and mind thank you.</p>
                        <div style={styles.xpBox}>
                            <p style={styles.xpText}>+{lastReward.xp} XP Gained</p>
                        </div>
                        <button onClick={onClose} style={styles.button}>
                            Continue
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// Dashboard provides an overview of stats and badges.
const Dashboard = ({ setCurrentPage }) => {
    const { userData } = useAuth();
    
    const styles = {
        pageContainer: {
            minHeight: '100vh',
            background: 'linear-gradient(to bottom right, #111827, #1e3a8a, #4f46e5)',
            color: 'white',
        },
        content: {
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '2rem',
        },
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
        },
        card: {
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            color: 'white',
        },
        cardTitle: {
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        },
        statGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
        },
        statItem: {
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
        },
        statValue: {
            fontSize: '1.5rem',
            fontWeight: 'bold'
        },
        statLabel: {
            fontSize: '0.875rem',
            color: '#9ca3af'
        },
        badgeList: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem'
        },
        badge: {
            backgroundColor: '#facc15',
            color: '#422006',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontWeight: '600',
            fontSize: '0.875rem'
        },
    };
    
    const earnedBadges = allBadges.filter(b => safeArray(userData.badges).includes(b.id));

    return (
        <div style={styles.pageContainer}>
            <Header />
            <main style={styles.content}>
                <div style={styles.container}>
                    <MoodHistoryChart />
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}><Star style={{color: '#a78bfa'}} /> Stats</h3>
                        <div style={styles.statGrid}>
                            <div style={styles.statItem}>
                                <p style={{...styles.statValue, color: '#a78bfa'}}>{userData.level || 1}</p>
                                <p style={styles.statLabel}>Current Level</p>
                            </div>
                            <div style={styles.statItem}>
                                <p style={{...styles.statValue, color: '#f87171'}}>{userData.streak || 0}</p>
                                <p style={styles.statLabel}>Quest Streak</p>
                            </div>
                            <div style={styles.statItem}>
                                <p style={{...styles.statValue, color: '#60a5fa'}}>{safeArray(userData.completedNodes).length}</p>
                                <p style={styles.statLabel}>Quests Done</p>
                            </div>
                            <div style={styles.statItem}>
                                <p style={{...styles.statValue, color: '#4ade80'}}>{safeArray(userData.journal).length}</p>
                                <p style={styles.statLabel}>Entries Written</p>
                            </div>
                        </div>
                    </div>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}><CheckCircle style={{color: '#facc15'}} /> Badges Earned ({earnedBadges.length})</h3>
                        {earnedBadges.length > 0 ? (
                            <div style={styles.badgeList}>
                                {earnedBadges.map(badge => (
                                    <div key={badge.id} style={styles.badge} title={badge.description}>{badge.name}</div>
                                ))}
                            </div>
                        ) : (
                            <p style={{color: '#9ca3af'}}>Your collection is just beginning. Complete quests and journal to earn badges!</p>
                        )}
                    </div>
                </div>
                 <div style={{ height: '10rem', width: '100%' }} /> {/* Spacer */}
            </main>
        </div>
    );
};

// MoodHistoryChart displays a bar chart of recent moods.
const MoodHistoryChart = () => {
    const { userData } = useAuth();
    const moodHistory = useMemo(() => {
        return safeArray(userData.moodHistory)
            .map(entry => ({
                date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                mood: entry.mood
            }))
            .reverse();
    }, [userData.moodHistory]);

    const formatMoodTick = (tickValue) => {
        const mood = moods.find(m => m.value === tickValue);
        return mood ? mood.label : '';
    };

    const styles = {
        card: {
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            color: 'white',
        },
        title: {
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
        },
        chartContainer: {
            height: '16rem'
        }
    };

    return (
        <div style={styles.card}>
            <h3 style={styles.title}>Recent Mood History</h3>
            <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moodHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" tick={{ fill: '#9ca3af' }} />
                        <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#9ca3af' }} tickFormatter={formatMoodTick} width={90} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                            labelStyle={{ color: '#f9fafb' }}
                            formatter={(value) => [getMoodProps(value)?.label, 'Mood']}
                        />
                        <Bar dataKey="mood" fill="#8b5cf6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ... (WorldMapPage and related components)
const WorldMapPage = ({ onNodeClick }) => {
    const { userData } = useAuth();
    const { pathToAutoOpen, setPathToAutoOpen } = useGame();
    const [view, setView] = useState('hub'); // 'hub', 'path', 'fitness'

    useEffect(() => {
        if (pathToAutoOpen) {
            setView('path');
        }
    }, [pathToAutoOpen]);

    if (!userData) return null;

    if (view === 'path') {
        return <PathView path={userData.mainPath} onBack={() => { setView('hub'); setPathToAutoOpen(null); }} onNodeClick={onNodeClick} />;
    }
    
    if (view === 'fitness') {
        return <FitnessHubView onBack={() => setView('hub')} />;
    }

    const mainPathData = goals.find(g => g.id === userData.mainPath);
    const pathIcon = {
        resilience: Shield,
        focus: Zap,
        positivity: Wind
    }[userData.mainPath];

    const isFitnessIslandLocked = safeArray(userData.completedNodes).length === 0;

    const styles = {
        container: {
            position: 'relative',
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        },
        background: {
            position: 'fixed',
            inset: 0,
            backgroundImage: "url('https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?q=80&w=1074&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        overlay: {
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        content: {
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
            padding: '1rem',
            paddingBottom: '8rem', // Space for nav
            color: 'white',
        },
        title: {
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            fontFamily: "'Cinzel Decorative', cursive",
        },
        subtitle: {
            fontSize: '1.125rem',
            color: '#d1d5db',
            marginBottom: '3rem',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
            width: '100%',
            maxWidth: '56rem',
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.background}></div>
            <div style={styles.overlay}></div>
            <Header />
            <div style={styles.content}>
                <h1 style={styles.title}>Your Journey</h1>
                <p style={styles.subtitle}>Continue your main path or visit the Fitness Hub.</p>
                <div style={{...styles.grid, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
                    <PathCard 
                        icon={pathIcon}
                        title={`Path of ${mainPathData.name}`}
                        description={mainPathData.description}
                        color={{resilience: 'red', focus: 'blue', positivity: 'green'}[userData.mainPath]}
                        onClick={() => setView('path')}
                    />
                   <PathCard 
                        icon={Dumbbell}
                        title="Fitness Hub"
                        description="Strengthen your body to support your mind."
                        color="orange"
                        onClick={() => !isFitnessIslandLocked && setView('fitness')}
                        isLocked={isFitnessIslandLocked}
                        lockMessage="Complete your first Big Quest to unlock"
                    />
                </div>
            </div>
        </div>
    );
};

const PathCard = ({ icon: Icon, title, description, color, onClick, isLocked = false, lockMessage }) => {
    const [isHovered, setIsHovered] = useState(false);

    const baseColors = {
        red: { from: 'rgba(239, 68, 68, 0.2)', to: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.5)', hoverBorder: '#ef4444', icon: '#f87171' },
        blue: { from: 'rgba(59, 130, 246, 0.2)', to: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.5)', hoverBorder: '#60a5fa', icon: '#60a5fa' },
        green: { from: 'rgba(34, 197, 94, 0.2)', to: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.5)', hoverBorder: '#4ade80', icon: '#4ade80' },
        orange: { from: 'rgba(249, 115, 22, 0.2)', to: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.5)', hoverBorder: '#f97316', icon: '#f97316' },
    };

    const currentColors = baseColors[color];

    const styles = {
        card: {
            position: 'relative',
            backgroundImage: `linear-gradient(to bottom right, ${currentColors.from}, ${currentColors.to})`,
            border: `2px solid ${isHovered && !isLocked ? currentColors.hoverBorder : currentColors.border}`,
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s ease',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked ? 0.5 : 1,
            transform: isHovered && !isLocked ? 'translateY(-10px)' : 'translateY(0px)',
        },
        lockOverlay: {
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: '0.875rem', // slightly smaller than card
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: '1rem',
        },
        lockText: {
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#e5e7eb',
        },
        icon: {
            marginBottom: '1rem',
            color: currentColors.icon,
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
        },
        description: {
            color: '#d1d5db',
        },
    };

    return (
        <div
            onClick={!isLocked ? onClick : () => {}}
            style={styles.card}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isLocked && (
                <div style={styles.lockOverlay}>
                    <Lock size={32} style={{ color: '#e5e7eb', marginBottom: '0.5rem' }} />
                    <p style={styles.lockText}>{lockMessage}</p>
                </div>
            )}
            <Icon style={styles.icon} size={48} />
            <h3 style={styles.title}>{title}</h3>
            <p style={styles.description}>{description}</p>
        </div>
    );
};

const PathView = ({ path, onBack, onNodeClick }) => {
    const { userData } = useAuth();
    const nodes = mapNodesData.filter(n => n.path === path);
    const containerRef = useRef(null);
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setSvgDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };
        
        const timeoutId = setTimeout(updateDimensions, 100);
        window.addEventListener('resize', updateDimensions);
        
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateDimensions);
        };
    }, [nodes]);
    
    const pathConfigs = {
        resilience: { title: "Path of Resilience", background: "url('https://images.unsplash.com/photo-1684691779309-ea3a0f0a4539?q=80&w=1171&auto=format&fit=crop')" },
        focus: { title: "Path of Focus", background: "url('https://images.unsplash.com/photo-1543946207-39bd91e70ca7?q=80&w=1974&auto=format&fit=crop')" },
        positivity: { title: "Path of Positivity", background: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1170&auto=format&fit=crop')" },
    };

    const currentPath = pathConfigs[path];

    const pathD = nodes.map((node, index) => {
        const command = index === 0 ? 'M' : 'L';
        const x = svgDimensions.width > 0 ? (parseInt(node.position.left) / 100) * svgDimensions.width : 0;
        const y = svgDimensions.height > 0 ? (parseInt(node.position.top) / 100) * svgDimensions.height : 0;
        return `${command} ${x} ${y}`;
    }).join(' ');

    const styles = {
        container: {
            position: 'fixed',
            inset: 0,
            overflowY: 'auto',
            backgroundImage: currentPath.background,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        overlay: {
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.1)',
        },
        header: {
            position: 'sticky',
            top: 0,
            padding: '1rem',
            zIndex: 30,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
        },
        backButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(31, 41, 55, 0.7)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            fontWeight: '600',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
        },
        title: {
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            fontFamily: "'Cinzel Decorative', cursive",
        },
        mapContainer: {
            position: 'relative',
            width: '100%',
            maxWidth: '48rem',
            margin: '0 auto',
            height: '250vh', // Increased height for scrolling
            zIndex: 20,
        },
        svg: {
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
        }
    };

    return (
        <motion.div 
            style={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div style={styles.overlay}></div>
            <div style={styles.header}>
                <button onClick={onBack} style={styles.backButton}>
                    <ArrowLeft size={20} />
                    <span>World Map</span>
                </button>
               <h2 style={styles.title}>{currentPath.title}</h2>
                <div style={{ width: '8.5rem' }}></div> {/* Spacer */}
            </div>

            <div ref={containerRef} style={styles.mapContainer}>
                <svg width={svgDimensions.width} height={svgDimensions.height} style={styles.svg}>
                    <path d={pathD} stroke={lineColors[path]} strokeWidth="2" fill="none" strokeDasharray="8 8" strokeOpacity={'0.7'} />
                </svg>
                {nodes.map((node) => {
                    const isUnlocked = safeArray(userData.unlockedNodes).includes(node.id);
                    const isCompleted = safeArray(userData.completedNodes).includes(node.id);
                    return <MapNode key={node.id} node={node} isUnlocked={isUnlocked} isCompleted={isCompleted} onClick={onNodeClick} />
                })}
            </div>
        </motion.div>
    );
};

// MapNode represents a single point on a path.
const MapNode = ({ node, isUnlocked, isCompleted, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const canClick = isUnlocked && !isCompleted;

    const pathStyles = {
        resilience: {
            unlocked: { backgroundColor: 'rgba(185, 28, 28, 0.9)', borderColor: '#ef4444' },
            locked: { backgroundColor: 'rgba(127, 29, 29, 0.9)', borderColor: '#b91c1c' },
        },
        focus: {
            unlocked: { backgroundColor: 'rgba(99, 102, 241, 0.8)', borderColor: '#a5b4fc' },
            locked: { backgroundColor: 'rgba(76, 29, 149, 0.9)', borderColor: '#6d28d9' },
        },
        positivity: {
            unlocked: { backgroundColor: 'rgba(245, 158, 11, 0.9)', borderColor: '#fcd34d' },
            locked: { backgroundColor: 'rgba(217, 119, 6, 0.9)', borderColor: '#f59e0b' },
        }
    };

    const getNodeStyle = () => {
        let style = {
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            borderWidth: '4px',
            borderStyle: 'solid',
            transition: 'all 0.3s ease',
            cursor: canClick ? 'pointer' : 'default',
            ...node.position
        };

        if (isCompleted) {
            const colors = pathStyles[node.path].unlocked;
            style.backgroundColor = colors.borderColor;
            style.borderColor = colors.borderColor;
            style.opacity = 0.7;
        } else if (isUnlocked) {
            const colors = pathStyles[node.path].unlocked;
            style.backgroundColor = colors.backgroundColor;
            style.borderColor = colors.borderColor;
            if (isHovered) {
                style.transform = 'translate(-50%, -50%) scale(1.1)';
                style.boxShadow = `0 0 20px ${colors.borderColor}`;
            }
        } else { // Locked
            const colors = pathStyles[node.path].locked;
            style.backgroundColor = colors.backgroundColor;
            style.borderColor = colors.borderColor;
        }
        return style;
    };

    const styles = {
        tooltip: {
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(17, 24, 39, 0.8)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            whiteSpace: 'nowrap',
            opacity: isHovered ? 1 : 0,
            visibility: isHovered ? 'visible' : 'hidden',
            transition: 'opacity 0.2s, visibility 0.2s',
            zIndex: 10
        }
    };

    return (
        <div
            style={getNodeStyle()}
            data-path={node.path}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => canClick && onClick(node)}
        >
            {isCompleted ? <CheckCircle size={24} color="white" /> : (isUnlocked ? <div style={{width: '0.75rem', height: '0.75rem', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '9999px'}}></div> : <Lock size={20} color="#9ca3af" />)}
            <div style={styles.tooltip}>{node.name}</div>
        </div>
    );
};

// ... (The rest of the components)
const FitnessHubView = ({ onBack }) => {
    const { userData, completeFitnessTask } = useGame();
    const { dailyFitness } = userData || {};
    const tasks = safeArray(dailyFitness?.tasks);
    const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed);

    const styles = {
        container: {
            position: 'fixed',
            inset: 0,
            overflowY: 'auto',
            backgroundImage: "url('https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=2071&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        overlay: {
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.1)',
        },
        header: {
            position: 'sticky',
            top: 0,
            padding: '1rem',
            zIndex: 30,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
        },
        backButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(31, 41, 55, 0.7)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            fontWeight: '600',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
        },
        title: {
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            fontFamily: "'Cinzel Decorative', cursive",
        },
        content: {
            position: 'relative',
            zIndex: 20,
            maxWidth: '42rem',
            margin: '0 auto',
            padding: '1rem',
            paddingBottom: '8rem',
            color: 'white',
            textAlign: 'center',
        },
        card: {
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '2rem',
            borderRadius: '0.75rem',
        },
        taskContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            textAlign: 'left',
        },
        taskItem: (isCompleted) => ({
            padding: '1rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.3s ease',
            backgroundColor: isCompleted ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        }),
        taskText: (isCompleted) => ({
            fontWeight: '600',
            transition: 'color 0.3s',
            color: isCompleted ? '#9ca3af' : '#ffffff',
            textDecoration: isCompleted ? 'line-through' : 'none',
        }),
        taskLevel: {
            fontWeight: 'bold',
            color: '#f97316',
            marginRight: '0.5rem',
        },
        completeButton: {
            padding: '0.5rem',
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
        },
        checkCircle: {
            width: '1.5rem',
            height: '1.5rem',
            borderRadius: '9999px',
            border: '2px solid #9ca3af',
        }
    };

    return (
        <motion.div style={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={styles.overlay}></div>
            <div style={styles.header}>
                <button onClick={onBack} style={styles.backButton}>
                    <ArrowLeft size={20} />
                    <span>World Map</span>
                </button>
                <h2 style={styles.title}>Fitness Hub</h2>
                <div style={{ width: '8.5rem' }}></div> {/* Spacer */}
            </div>
            <div style={styles.content}>
                <div style={styles.card}>
                    <Dumbbell size={64} style={{ margin: '0 auto 1rem', color: '#f97316' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Daily Physical Challenge</h3>
                    <p style={{ color: '#d1d5db', marginBottom: '1.5rem' }}>Strengthen your body to support your mind. Complete these tasks for a bonus reward.</p>
                    
                    <div style={styles.taskContainer}>
                        {tasks.map(task => (
                            <div key={task.id} style={styles.taskItem(task.completed)}>
                                <p style={styles.taskText(task.completed)}>
                                    <span style={styles.taskLevel}>Step {task.level}:</span>
                                    {task.text}
                                </p>
                                <button
                                    onClick={() => !task.completed && completeFitnessTask(task.id)}
                                    disabled={task.completed}
                                    style={{...styles.completeButton, cursor: task.completed ? 'not-allowed' : 'pointer'}}
                                >
                                    {task.completed ? <CheckCircle style={{ color: '#4ade80' }} size={24} /> : <div style={styles.checkCircle}></div>}
                                </button>
                            </div>
                        ))}
                    </div>

                    {allTasksCompleted && (
                        <div style={{ marginTop: '2rem', color: '#4ade80' }}>
                            <p style={{ fontSize: '1.25rem', fontWeight: '600' }}>Well done! All challenges complete for today.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const NodeModal = ({ node, onClose }) => {
    const { userData, completeNodeTask } = useGame();
    const bigQuest = userData.dailyContent?.bigQuest;
    const isTodayQuest = bigQuest && userData.dailyContent.allSmallTasksCompleted;

    const styles = {
        overlay: {
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        modal: {
            backgroundColor: '#1f2937', color: 'white', borderRadius: '1rem',
            padding: '1.5rem', width: '100%', maxWidth: '32rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid',
            borderColor: lineColors[node.path]
        },
        header: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'
        },
        title: {
            fontSize: '1.5rem', fontWeight: 'bold'
        },
        closeButton: {
            background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer'
        },
        questText: {
            backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: '1rem', borderRadius: '0.5rem',
            marginBottom: '1.5rem', color: '#d1d5db'
        },
        button: {
            width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
            fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s'
        },
        buttonDisabled: {
            backgroundColor: '#6b7280', cursor: 'not-allowed'
        }
    };
    
    return (
        <AnimatePresence>
            {node && (
                <div style={styles.overlay}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={styles.modal}>
                        <div style={styles.header}>
                            <h2 style={styles.title}>{node.name}</h2>
                            <button onClick={onClose} style={styles.closeButton}><X size={24} /></button>
                        </div>
                        <div style={styles.questText}>
                            {isTodayQuest ? (
                                <>
                                    <p style={{fontWeight: '600', marginBottom: '0.5rem'}}>Your Big Quest for today:</p>
                                    <p>{bigQuest.task}</p>
                                </>
                            ) : (
                                <p>Complete all your small daily tasks to unlock today's Big Quest.</p>
                            )}
                        </div>
                        <button 
                            onClick={() => { completeNodeTask(node); onClose(); }} 
                            disabled={!isTodayQuest} 
                            style={{...styles.button, backgroundColor: lineColors[node.path], ...(!isTodayQuest && styles.buttonDisabled)}}
                        >
                            Complete Quest
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const usePreloadImages = (urls) => {
    useEffect(() => {
        urls.forEach(url => {
            if (url) {
                const img = new Image();
                img.src = url;
            }
        });
    }, [urls]);
};

// MindQuestApp is the root component that manages page routing and modals.
const MindQuestApp = () => {
    const { userData, loading } = useAuth();
    const { 
        modalState, closeModal, 
        deleteJournalEntry, confirmEditJournal, 
        unlockedNodeInfo, setUnlockedNodeInfo, 
        setPathToAutoOpen 
    } = useGame();
    const [currentPage, setCurrentPage] = useState('quest');
    const [isNavOpen, setIsNavOpen] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);
    const [mapKey, setMapKey] = useState(Date.now());

    // Preload all critical background images
    usePreloadImages([
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        'https://images.unsplash.com/photo-1637689113621-73951984fcc1?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?q=80&w=1074&auto=format&fit=crop',
        userData?.avatarUrl
    ].filter(Boolean)); // filter(Boolean) removes any null/undefined values


    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Inter:wght@400;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, []);

    if (loading) return <div style={{minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827'}}><p style={{fontSize: '1.25rem', fontWeight: '600', color: 'white'}}>Loading your world...</p></div>;
    if (!userData) return <Onboarding />;

    const pageVariants = { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } };
    
    const handleCloseRewardModal = () => closeModal('showReward');

    const handleGoToMap = () => {
        if (unlockedNodeInfo) {
            setPathToAutoOpen(unlockedNodeInfo.path);
            setCurrentPage('map');
        }
        closeModal('showNodeUnlockModal');
        setUnlockedNodeInfo(null);
    };
    
    const handleCloseNodeUnlockModal = () => {
        closeModal('showNodeUnlockModal');
        setUnlockedNodeInfo(null);
    };

    const renderPage = () => {
        switch(currentPage) {
            case 'quest': return <DailyQuestScreen />;
            case 'dashboard': return <Dashboard setCurrentPage={setCurrentPage} />;
            case 'journal': return <JournalPage />;
            case 'map': return <WorldMapPage key={mapKey} onNodeClick={setSelectedNode} />;
            default: return <DailyQuestScreen />;
        }
    }
    
    const styles = {
        mainContainer: {
            fontFamily: "'Inter', sans-serif",
            minHeight: '100vh',
            width: '100vw', // Fix: Ensure full width
            backgroundColor: '#111827', // Base background to prevent white flash
        },
        nav: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(4px)',
            borderTop: '1px solid #374151',
            zIndex: 40,
        },
        navContainer: {
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '0.5rem',
        },
        navButton: (isActive) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            transition: 'all 0.2s',
            color: isActive ? '#c4b5fd' : '#d1d5db',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem'
        }),
        navToggle: {
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            zIndex: 50,
            backgroundColor: '#7c3aed',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '9999px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s',
            border: 'none',
            cursor: 'pointer',
        }
    };

    return (
        <div style={styles.mainContainer}>
            <AnimatePresence mode="wait">
                <motion.div key={currentPage} initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2, ease: 'easeInOut' }}>
                    {renderPage()}
                </motion.div>
            </AnimatePresence>
            
            {selectedNode && <NodeModal node={selectedNode} onClose={() => setSelectedNode(null)} />}

            <AnimatePresence>
                {isNavOpen && (
                    <motion.nav key="navbar" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "tween", duration: 0.3, ease: 'easeOut' }} style={styles.nav}>
                        <div style={styles.navContainer}>
                            <button onClick={() => setCurrentPage('quest')} style={styles.navButton(currentPage === 'quest')}><Home size={20}/><span>Quest</span></button>
                            <button onClick={() => setCurrentPage('dashboard')} style={styles.navButton(currentPage === 'dashboard')}><LayoutDashboard size={20}/><span>Dashboard</span></button>
                            <button onClick={() => { setCurrentPage('map'); setMapKey(Date.now()); }} style={styles.navButton(currentPage === 'map')}><Map size={20}/><span>Map</span></button>
                            <button onClick={() => setCurrentPage('journal')} style={styles.navButton(currentPage === 'journal')}><BookText size={20}/><span>Journal</span></button>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
            
            <button onClick={() => setIsNavOpen(!isNavOpen)} style={styles.navToggle} aria-label={isNavOpen ? 'Hide navigation' : 'Show navigation'}>
                {isNavOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            </button>

            <RewardModal onClose={handleCloseRewardModal} />
            <NodeUnlockModal isOpen={modalState.showNodeUnlockModal} onClose={handleCloseNodeUnlockModal} onConfirm={handleGoToMap} />
            <FitnessUnlockModal isOpen={modalState.showFitnessUnlockModal} onClose={() => closeModal('showFitnessUnlockModal')} />
            <FitnessCompleteModal isOpen={modalState.showFitnessCompleteModal} onClose={() => closeModal('showFitnessCompleteModal')} />
            <JournalModal />
            <JournalDetailModal />
            <ConfirmationModal isOpen={modalState.isDeleteConfirmOpen} onClose={() => closeModal('isDeleteConfirmOpen')} onConfirm={deleteJournalEntry} title="Delete Journal Entry?" message="This action is permanent and cannot be undone. Are you sure?" />
            <ConfirmationModal isOpen={modalState.isEditConfirmOpen} onClose={() => closeModal('isEditConfirmOpen')} onConfirm={confirmEditJournal} title="Edit Entry?" message="Editing this entry will clear its current AI insight. You can generate a new one after saving. Do you want to continue?" />
        </div>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <GameProvider>
                <Toaster position="top-center" reverseOrder={false} />
                <MindQuestApp />
            </GameProvider>
        </AuthProvider>
    );
}
