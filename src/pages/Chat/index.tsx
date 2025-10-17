import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { API_BASE_URL } from '../../config';
import chatWebSocket from '../../services/chatWebSocket';
import {
  normalizeProblemStatus,
  ProblemStatus,
} from '../../types/problem-status';

interface LanguageContent {
  language: string;
  title: string;
  display_name?: string;
}

interface User {
  user_id: string;
  username: string;
}

interface ProblemDifficulty {
  problem_difficulty_id: string;
  display_names: { language: string; display_name: string }[];
}

interface Problem {
  problem_id: string;
  title: LanguageContent[];
  status: ProblemStatus;
  creator: User;
  reviewer: User;
  testers: User[];
  target_contest: unknown;
  assigned_contest: unknown;
  problem_difficulty: ProblemDifficulty;
  created_at: string;
  updated_at: string;
}

interface BaseMessage {
  message_type: string;
  timestamp: string;
}

interface UserMessagePayload {
  message_id: string;
  sender: {
    user_id: string;
    username: string;
  };
  content: string;
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    content_type: string;
  }>;
  status?: 'sending' | 'sent' | 'failed';
}

interface ReviewedMessagePayload {
  reviewer: {
    user_id: string;
    username: string;
  };
  decision: ProblemStatus;
}

interface TestedMessagePayload {
  tester: {
    user_id: string;
    username: string;
  };
  status: 'passed' | 'failed';
}

interface UserMessage extends BaseMessage {
  message_type: 'user';
  payload: UserMessagePayload;
}

interface ReviewedMessage extends BaseMessage {
  message_type: 'reviewed';
  payload: ReviewedMessagePayload;
}

interface TestedMessage extends BaseMessage {
  message_type: 'tested';
  payload: TestedMessagePayload;
}

// Generic system message for other message types
interface SystemMessagePayload {
  message: string;
}

interface SystemMessage extends BaseMessage {
  message_type: string;
  payload: SystemMessagePayload;
}

type Message = UserMessage | ReviewedMessage | TestedMessage | SystemMessage;

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeProblem, setActiveProblem] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'connecting' | 'error'
  >('connecting');
  const fetchedProblems = useRef<Set<string>>(new Set());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000;

  const connectToWebSocket = async () => {
    try {
      setConnectionStatus('connecting');
      await chatWebSocket.connect();
      setConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      console.log('WebSocket connected successfully');

      // When reconnecting, ensure we set the active problem again
      if (activeProblem) {
        try {
          chatWebSocket.setActiveProblem(activeProblem);
        } catch (error) {
          console.error(
            'Error setting active problem after connection:',
            error,
          );
        }
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnected(false);

      // Differentiate between different types of connection errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        setConnectionStatus('error');
        console.log('Connection attempt aborted');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        setConnectionStatus('error');
        console.log('Connection timed out');
      } else {
        setConnectionStatus('error');
        console.log('Connection failed');
      }

      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        console.log(
          `Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`,
        );
        setTimeout(connectToWebSocket, reconnectInterval);
      } else {
        console.log('Max reconnect attempts reached. Giving up.');
      }
    }
  };

  // Define event handlers
  // Listen for new messages
  const handleUserMessage = (data: unknown) => {
    const typedData = data as {
      type: string;
      payload: {
        id: string;
        problem_id: string;
        sender: {
          id: string;
          username: string;
        };
        content: string;
        attachments: Array<{
          id: string;
          url: string;
          filename: string;
          content_type: string;
        }>;
        timestamp: string;
      };
      request_id: string;
    };

    if (typedData.type === 'user') {
      // The WebSocket sends a payload that matches the expected server structure
      const payload = typedData.payload;
      const userMessage: UserMessage = {
        message_type: 'user',
        payload: {
          message_id: payload.id,
          sender: {
            user_id: payload.sender.id,
            username: payload.sender.username,
          },
          content: payload.content,
          attachments: payload.attachments || [],
          status: 'sent',
        },
        timestamp: payload.timestamp,
      };

      // Replace optimistic message if it exists or add new message
      setMessages((prev) => {
        const problemId = payload.problem_id;
        const problemMessages = [...(prev[problemId] || [])];

        const optimisticMsgIndex = problemMessages.findIndex(
          (msg) =>
            msg.message_type === 'user' &&
            (msg as UserMessage).payload.content ===
              userMessage.payload.content &&
            (msg as UserMessage).payload.status === 'sending',
        );

        if (optimisticMsgIndex !== -1) {
          // Replace the optimistic message with the confirmed one
          problemMessages[optimisticMsgIndex] = userMessage;
        } else {
          // Add as a new message
          problemMessages.push(userMessage);
        }

        return {
          ...prev,
          [problemId]: problemMessages,
        };
      });
    }
  };

  // Listen for connection status changes
  const handleConnectionStatus = () => {
    setConnected(true);
    setConnectionStatus('connected');
    // If we have an active problem, set it after reconnection
    if (activeProblem) {
      try {
        chatWebSocket.setActiveProblem(activeProblem);
        console.log(
          `Set active problem to ${activeProblem} in WebSocket after reconnection`,
        );
      } catch (error) {
        console.error(
          'Error setting active problem after reconnection:',
          error,
        );
      }
    }
  };

  const handleDisconnectionStatus = () => {
    setConnected(false);
    setConnectionStatus('disconnected');
  };

  const handleErrorStatus = () => {
    setConnected(false);
    setConnectionStatus('error');
  };

  // Listen for status updates
  const handleStatusUpdates = (data: unknown) => {
    // Type guard for expected structure
    if (
      typeof data === 'object' &&
      data !== null &&
      'type' in data &&
      'payload' in data &&
      typeof (data as { type?: unknown }).type === 'string' &&
      typeof (data as { payload?: unknown }).payload === 'object' &&
      (data as { payload?: unknown }).payload !== null &&
      (data as { payload?: { problem_id?: unknown } }).payload !== undefined &&
      (data as { payload?: { problem_id?: unknown } }).payload &&
      (data as { payload?: { problem_id?: unknown } }).payload !== undefined &&
      // @ts-expect-error assuming payload is an object with problem_id
      'problem_id' in (data as { payload?: { problem_id?: unknown } }).payload
    ) {
      const typedData = data as {
        type: string;
        payload: {
          problem_id: string;
          reviewer?: { id: string; username: string };
          tester?: { id: string; username: string };
          decision?: string;
          status?: string;
          message?: string;
          timestamp: string;
        };
        request_id: string;
      };

      // Handle different status updates (submitted, reviewed, tested, completed)
      console.log(
        `Status update (${typedData.type}) for problem:`,
        typedData.payload.problem_id,
      );

      if (typedData.type === 'reviewed') {
        const reviewedMessage: ReviewedMessage = {
          message_type: 'reviewed',
          payload: {
            reviewer: {
              user_id: typedData.payload.reviewer?.id || '',
              username: typedData.payload.reviewer?.username || '',
            },
            decision: normalizeProblemStatus(typedData.payload.decision),
          },
          timestamp: typedData.payload.timestamp,
        };

        setMessages((prev) => {
          const problemId = typedData.payload.problem_id;
          const problemMessages = prev[problemId] || [];
          return {
            ...prev,
            [problemId]: [...problemMessages, reviewedMessage],
          };
        });
      } else if (typedData.type === 'tested') {
        const testedMessage: TestedMessage = {
          message_type: 'tested',
          payload: {
            tester: {
              user_id: typedData.payload.tester?.id || '',
              username: typedData.payload.tester?.username || '',
            },
            status: typedData.payload.status as 'passed' | 'failed',
          },
          timestamp: typedData.payload.timestamp,
        };

        setMessages((prev) => {
          const problemId = typedData.payload.problem_id;
          const problemMessages = prev[problemId] || [];
          return {
            ...prev,
            [problemId]: [...problemMessages, testedMessage],
          };
        });
      } else {
        // For other system message types (submitted, completed, etc.)
        const systemMessage: SystemMessage = {
          message_type: typedData.type,
          payload: {
            message:
              typedData.payload.message ||
              `System notification: ${typedData.type}`,
          },
          timestamp: typedData.payload.timestamp,
        };

        setMessages((prev) => {
          const problemId = typedData.payload.problem_id;
          const problemMessages = prev[problemId] || [];
          return {
            ...prev,
            [problemId]: [...problemMessages, systemMessage],
          };
        });
      }
    } else {
      console.warn('Received status update with unexpected structure:', data);
    }
  };

  // Connect to WebSocket and set up listeners when component mounts
  useEffect(() => {
    window.addEventListener('beforeunload', () => {
      // Ensure we disconnect cleanly when the page is closed
      chatWebSocket.disconnect();
    });

    return () => {
      window.removeEventListener('beforeunload', () => {
        chatWebSocket.disconnect();
      });
    };
  }, []);

  useEffect(() => {
    // Connect to the WebSocket
    connectToWebSocket();

    // Listen for new messages
    chatWebSocket.on('user', handleUserMessage);

    // Listen for connection status changes
    chatWebSocket.on('connected', handleConnectionStatus);
    chatWebSocket.on('disconnected', handleDisconnectionStatus);
    chatWebSocket.on('error', handleErrorStatus);

    // Listen for status updates
    chatWebSocket.on('submitted', handleStatusUpdates);
    chatWebSocket.on('reviewed', handleStatusUpdates);
    chatWebSocket.on('tested', handleStatusUpdates);
    chatWebSocket.on('completed', handleStatusUpdates);

    // Cleanup when component unmounts
    return () => {
      chatWebSocket.off('user', handleUserMessage);
      chatWebSocket.off('submitted', handleStatusUpdates);
      chatWebSocket.off('reviewed', handleStatusUpdates);
      chatWebSocket.off('tested', handleStatusUpdates);
      chatWebSocket.off('completed', handleStatusUpdates);
      chatWebSocket.off('connected', handleConnectionStatus);
      chatWebSocket.off('disconnected', handleDisconnectionStatus);
      chatWebSocket.off('error', handleErrorStatus);
      chatWebSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all problems
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/problems`, {
          headers: {
            'ngrok-skip-browser-warning': 'abc',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch problems');
        }

        const data: {
          problems: Array<Omit<Problem, 'status'> & { status: string }>;
        } = await response.json();
        const normalizedProblems: Problem[] = data.problems.map((problem) => ({
          ...problem,
          status: normalizeProblemStatus(problem.status),
        }));
        setProblems(normalizedProblems);

        // Set default active problem if none is selected
        if (!activeProblem && data.problems.length > 0) {
          setActiveProblem(id || data.problems[0].problem_id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching problems:', error);
        setLoading(false);
      }
    };

    fetchProblems();
  }, [activeProblem, id]);

  // Update active problem when URL param changes
  useEffect(() => {
    if (id && problems.length > 0) {
      const problemExists = problems.some(
        (problem) => problem.problem_id === id,
      );
      if (problemExists) {
        setActiveProblem(id);
      } else {
        // Redirect to the first problem if the ID doesn't exist
        navigate(`/chat/${problems[0].problem_id}`);
      }
    }
  }, [id, problems, navigate]);

  // Navigate to active problem when it changes and set it as active in WebSocket
  useEffect(() => {
    if (activeProblem) {
      if (id !== activeProblem) {
        navigate(`/chat/${activeProblem}`);
      }

      // Set the active problem in the WebSocket if we're connected
      if (connected) {
        try {
          chatWebSocket.setActiveProblem(activeProblem);
          console.log(`Set active problem to ${activeProblem} in WebSocket`);
        } catch (error) {
          console.error('Error setting active problem in WebSocket:', error);
        }
      }
    }
  }, [activeProblem, id, navigate, connected]);

  // Fetch messages for active problem
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeProblem) return;

      // Skip if we already fetched messages for this problem
      if (fetchedProblems.current.has(activeProblem)) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/problems/${activeProblem}/messages`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'abc',
            },
            credentials: 'include',
          },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        if (Array.isArray(data.messages)) {
          const normalizedMessages = (data.messages as unknown[])
            .map((message) => {
              if (
                typeof message === 'object' &&
                message !== null &&
                'message_type' in message &&
                (message as { message_type: unknown }).message_type ===
                  'reviewed' &&
                'payload' in message &&
                typeof (message as { payload?: unknown }).payload ===
                  'object' &&
                (message as { payload?: unknown }).payload !== null
              ) {
                const reviewed = message as {
                  message_type: 'reviewed';
                  payload: {
                    decision?: string | null;
                    reviewer: ReviewedMessagePayload['reviewer'];
                  } & Record<string, unknown>;
                  timestamp: string;
                };

                return {
                  ...reviewed,
                  payload: {
                    ...reviewed.payload,
                    decision: normalizeProblemStatus(reviewed.payload.decision),
                  },
                } satisfies ReviewedMessage;
              }

              return message as Message;
            })
            .sort(
              (a: Message, b: Message) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
            );

          setMessages((prev) => ({
            ...prev,
            [activeProblem]: normalizedMessages,
          }));
        }

        // Mark this problem as fetched
        fetchedProblems.current.add(activeProblem);
      } catch (error) {
        console.error(
          `Error fetching messages for problem ${activeProblem}:`,
          error,
        );
      }
    };

    if (activeProblem) {
      fetchMessages();
    }
  }, [activeProblem]);

  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeProblem || connectionStatus === 'error')
      return;

    // Visual feedback that a message is being sent
    setIsSending(true);

    // Create optimistic message
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: UserMessage = {
      message_type: 'user',
      payload: {
        message_id: optimisticId,
        sender: {
          user_id: localStorage.getItem('userId') || '',
          username: localStorage.getItem('username') || 'You',
        },
        content: message,
        attachments: [],
        status: 'sending',
      },
      timestamp: new Date().toISOString(),
    };

    // Add optimistic message to UI immediately
    setMessages((prev) => ({
      ...prev,
      [activeProblem]: [...(prev[activeProblem] || []), optimisticMessage],
    }));

    // Clear input field immediately
    const sentMessage = message;
    setMessage('');
    setIsSending(false);

    // Try to send via WebSocket first
    if (connected) {
      try {
        // This will send through WebSocket
        chatWebSocket.sendMessage(activeProblem, sentMessage);
        // The WebSocket response will update the message status via the handleUserMessage
        return;
      } catch (error) {
        console.error(
          'Error sending message via WebSocket, falling back to REST API:',
          error,
        );
        // We continue to the REST API fallback below
      }
    }
  };

  // Fix message sorting to ensure chronological order
  const sortedMessages =
    activeProblem && messages[activeProblem]
      ? [...messages[activeProblem]].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )
      : [];

  if (loading) {
    return (
      <div className="flex h-full bg-slate-900 w-full items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-900 w-full">
      <div className="w-72 bg-slate-800 border-r border-slate-700/50 flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="text-xl font-medium text-white">Problems</h2>
        </div>

        <div className="flex-1 overflow-auto">
          <ul className="px-2 py-3 space-y-1">
            {problems?.map((problem) => (
              <li key={problem.problem_id}>
                <button
                  className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeProblem === problem.problem_id
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'
                  }`}
                  onClick={() => setActiveProblem(problem.problem_id)}
                  type="button"
                >
                  <span className="font-medium">
                    {problem.title[0]?.title || 'Untitled Problem'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-medium text-white flex items-center justify-between">
            <span>
              {problems.find((problem) => problem.problem_id === activeProblem)
                ?.title[0]?.title || 'Select a problem'}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500'
                      : connectionStatus === 'disconnected'
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                } ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}
              />
              <span className="text-xs text-slate-400">
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'connecting'
                    ? `Connecting${reconnectAttempts.current > 0 ? ` (Attempt ${reconnectAttempts.current}/${maxReconnectAttempts})` : '...'}`
                    : connectionStatus === 'disconnected'
                      ? 'Disconnected'
                      : reconnectAttempts.current >= maxReconnectAttempts
                        ? 'Connection failed'
                        : 'Connection Error'}
              </span>
              {connectionStatus !== 'connected' && (
                <button
                  type="button"
                  onClick={() => {
                    reconnectAttempts.current = 0;
                    connectToWebSocket();
                  }}
                  className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded transition-colors"
                >
                  Reconnect
                </button>
              )}
            </div>
          </h3>
        </div>

        <div className="flex-1 p-6 overflow-auto bg-slate-900">
          {activeProblem ? (
            <div className="space-y-4">
              {sortedMessages.map((msg, index) => {
                // Format timestamp
                const formattedTime = new Date(
                  msg.timestamp,
                ).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                // Format date
                const formattedDate = new Date(
                  msg.timestamp,
                ).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                if (msg.message_type === 'user') {
                  const userMsg = msg as UserMessage;
                  const isCurrentUser =
                    userMsg.payload.sender.user_id ===
                    localStorage.getItem('userId');

                  return (
                    <div
                      key={userMsg.payload.message_id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isCurrentUser
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {!isCurrentUser && (
                          <div className="font-medium text-indigo-400 text-sm mb-1">
                            {userMsg.payload.sender.username}
                          </div>
                        )}
                        <p>{userMsg.payload.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {userMsg.payload.status === 'sending' && (
                            <span className="text-xs text-indigo-200 animate-pulse">
                              Sending...
                            </span>
                          )}
                          {userMsg.payload.status === 'failed' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-red-300">
                                Failed to send
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Retry sending this message
                                  const contentToResend =
                                    userMsg.payload.content;

                                  // Remove the failed message
                                  setMessages((prev) => ({
                                    ...prev,
                                    [activeProblem]: prev[activeProblem].filter(
                                      (m) =>
                                        !(
                                          m.message_type === 'user' &&
                                          (m as UserMessage).payload
                                            .message_id ===
                                            userMsg.payload.message_id
                                        ),
                                    ),
                                  }));

                                  // Set message and trigger send
                                  setMessage(contentToResend);
                                  setTimeout(() => {
                                    const form = document.querySelector(
                                      'form',
                                    ) as HTMLFormElement;
                                    if (form)
                                      form.dispatchEvent(
                                        new Event('submit', {
                                          cancelable: true,
                                        }),
                                      );
                                  }, 0);
                                }}
                                className="text-xs text-indigo-300 hover:text-indigo-200 underline"
                              >
                                Retry
                              </button>
                            </div>
                          )}
                          <span
                            className={`text-xs ${
                              isCurrentUser
                                ? 'text-indigo-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {formattedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                } else if (msg.message_type === 'reviewed') {
                  const reviewedMsg = msg as ReviewedMessage;
                  const decisionStatusLabel = t(
                    `problem.statuses.${reviewedMsg.payload.decision}`,
                    {
                      defaultValue: reviewedMsg.payload.decision
                        .split('_')
                        .map(
                          (segment) =>
                            segment.charAt(0).toUpperCase() + segment.slice(1),
                        )
                        .join(' '),
                    },
                  );

                  return (
                    <div
                      key={`reviewed-${String(index)}-${Math.random().toString(36).substring(2, 9)}`}
                      className="flex justify-center"
                    >
                      <div className="bg-slate-800 text-slate-300 px-4 py-2 rounded-md text-xs max-w-[80%] text-center">
                        <span className="font-semibold">
                          {reviewedMsg.payload.reviewer.username}
                        </span>{' '}
                        changed the status to {decisionStatusLabel}
                        <div className="text-slate-400 mt-1">
                          {formattedDate} at {formattedTime}
                        </div>
                      </div>
                    </div>
                  );
                } else if (msg.message_type === 'tested') {
                  const testedMsg = msg as TestedMessage;
                  const statusColor =
                    testedMsg.payload.status === 'passed'
                      ? 'text-green-400'
                      : 'text-red-400';

                  return (
                    <div
                      key={`tested-${String(index)}-${Math.random().toString(36).substring(2, 9)}`}
                      className="flex justify-center"
                    >
                      <div className="bg-slate-800 text-slate-300 px-4 py-2 rounded-md text-xs max-w-[80%] text-center">
                        <span className="font-semibold">
                          {testedMsg.payload.tester.username}
                        </span>{' '}
                        tested the problem and it
                        <span className={`font-semibold ml-1 ${statusColor}`}>
                          {testedMsg.payload.status === 'passed'
                            ? 'passed'
                            : 'failed'}
                        </span>
                        <div className="text-slate-400 mt-1">
                          {formattedDate} at {formattedTime}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Handle any other message types as generic system messages
                  const systemMsg = msg as SystemMessage;
                  return (
                    <div
                      key={`system-${String(index)}-${Math.random().toString(36).substring(2, 9)}`}
                      className="flex justify-center"
                    >
                      <div className="bg-slate-800 text-slate-300 px-4 py-2 rounded-md text-xs max-w-[80%] text-center">
                        {systemMsg.payload.message ||
                          `System: ${systemMsg.message_type}`}
                        <div className="text-slate-400 mt-1">
                          {formattedDate} at {formattedTime}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              Select a problem to view messages
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-800">
          <form onSubmit={sendMessage} className="flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                connectionStatus === 'error'
                  ? 'Connection error. Try reconnecting...'
                  : 'Type a message...'
              }
              disabled={
                !activeProblem || connectionStatus === 'error' || isSending
              }
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={
                !activeProblem ||
                connectionStatus === 'error' ||
                message.trim() === '' ||
                isSending
              }
              className={`px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg transition-colors disabled:bg-indigo-500/50 disabled:cursor-not-allowed ${isSending ? 'opacity-70 animate-pulse' : ''}`}
            >
              {isSending ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
