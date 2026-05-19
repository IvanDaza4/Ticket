'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Search, 
  Send, 
  Plus, 
  MessageSquare, 
  User,
  Loader2,
  Check,
  CheckCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  avatar_url: string | null
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender?: Profile
}

interface Conversation {
  id: string
  updated_at: string
  participants: { user: Profile }[]
  last_message?: Message
  unread_count: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        fetchConversations(user.id)
        fetchAvailableUsers(user.id)
      }
    }
    init()
  }, [])

  async function fetchConversations(userId: string) {
    const { data: participations } = await supabase
      .from('internal_conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversation:internal_conversations(
          id,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('conversation(updated_at)', { ascending: false })

    if (!participations) {
      setLoading(false)
      return
    }

    const conversationsWithDetails = await Promise.all(
      participations.map(async (p) => {
        const convId = p.conversation_id

        // Get participants
        const { data: participants } = await supabase
          .from('internal_conversation_participants')
          .select(`
            user:profiles(id, first_name, last_name, email, role, avatar_url)
          `)
          .eq('conversation_id', convId)
          .neq('user_id', userId)

        // Get last message
        const { data: lastMessages } = await supabase
          .from('internal_messages')
          .select('*, sender:profiles(first_name, last_name)')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)

        // Count unread
        const { count } = await supabase
          .from('internal_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .neq('sender_id', userId)
          .gt('created_at', p.last_read_at || '1970-01-01')

        return {
          id: convId,
          updated_at: (p.conversation as any)?.updated_at,
          participants: participants || [],
          last_message: lastMessages?.[0],
          unread_count: count || 0
        }
      })
    )

    setConversations(conversationsWithDetails)
    setLoading(false)
  }

  async function fetchAvailableUsers(currentUserId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, avatar_url')
      .in('role', ['technician', 'admin'])
      .neq('id', currentUserId)
      .order('first_name')

    if (data) {
      setAvailableUsers(data)
    }
  }

  async function fetchMessages(conversationId: string) {
    const { data } = await supabase
      .from('internal_messages')
      .select(`
        *,
        sender:profiles(id, first_name, last_name, role, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
      scrollToBottom()
    }

    // Mark as read
    if (currentUserId) {
      await supabase
        .from('internal_conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId)

      // Update local unread count
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
      )
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return

    setSendingMessage(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    const { data, error } = await supabase
      .from('internal_messages')
      .insert({
        conversation_id: selectedConversation,
        sender_id: currentUserId,
        content: messageContent
      })
      .select(`
        *,
        sender:profiles(id, first_name, last_name, role, avatar_url)
      `)
      .single()

    if (!error && data) {
      setMessages(prev => [...prev, data])
      scrollToBottom()
      
      // Update conversation list
      if (currentUserId) {
        fetchConversations(currentUserId)
      }
    }

    setSendingMessage(false)
  }

  async function startNewConversation() {
    if (!selectedUser || !currentUserId) return

    // Check if conversation already exists
    const { data: existingParticipations } = await supabase
      .from('internal_conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId)

    if (existingParticipations) {
      for (const p of existingParticipations) {
        const { data: otherParticipant } = await supabase
          .from('internal_conversation_participants')
          .select('user_id')
          .eq('conversation_id', p.conversation_id)
          .eq('user_id', selectedUser.id)
          .single()

        if (otherParticipant) {
          // Conversation exists, select it
          setSelectedConversation(p.conversation_id)
          fetchMessages(p.conversation_id)
          setIsNewConversationOpen(false)
          setSelectedUser(null)
          return
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('internal_conversations')
      .insert({})
      .select()
      .single()

    if (convError || !newConv) return

    // Add participants
    await supabase
      .from('internal_conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: currentUserId },
        { conversation_id: newConv.id, user_id: selectedUser.id }
      ])

    setSelectedConversation(newConv.id)
    fetchConversations(currentUserId)
    fetchMessages(newConv.id)
    setIsNewConversationOpen(false)
    setSelectedUser(null)
  }

  // Real-time subscription
  useEffect(() => {
    if (!selectedConversation) return

    const channel = supabase
      .channel(`messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        async (payload) => {
          const newMsg = payload.new as any
          if (newMsg.sender_id !== currentUserId) {
            const { data } = await supabase
              .from('internal_messages')
              .select(`*, sender:profiles(id, first_name, last_name, role, avatar_url)`)
              .eq('id', newMsg.id)
              .single()
            
            if (data) {
              setMessages(prev => [...prev, data])
              scrollToBottom()
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, currentUserId, supabase])

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const otherUser = conv.participants[0]?.user
    if (!otherUser) return false
    return `${otherUser.first_name} ${otherUser.last_name} ${otherUser.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  })

  const selectedConv = conversations.find(c => c.id === selectedConversation)
  const otherUser = selectedConv?.participants[0]?.user

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Mensajes
        </h1>
        <p className="text-muted-foreground">
          Comunicacion interna entre tecnicos y administradores
        </p>
      </div>

      <div className="grid md:grid-cols-[320px,1fr] gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Conversations List */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversaciones</CardTitle>
              <Button size="sm" onClick={() => setIsNewConversationOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Nueva
              </Button>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay conversaciones</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conv) => {
                    const user = conv.participants[0]?.user
                    if (!user) return null

                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv.id)
                          fetchMessages(conv.id)
                        }}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left",
                          selectedConversation === conv.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className={cn(
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          )}>
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">
                              {user.first_name} {user.last_name}
                            </span>
                            {conv.unread_count > 0 && (
                              <Badge className="bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message?.content || 'Sin mensajes'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Messages Area */}
        <Card className="flex flex-col">
          {selectedConversation && otherUser ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className={cn(
                      otherUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {otherUser.first_name?.[0]}{otherUser.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {otherUser.first_name} {otherUser.last_name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs capitalize">
                      {otherUser.role === 'admin' ? 'Administrador' : 'Tecnico'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isMine ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={cn(
                            "text-xs mt-1 flex items-center gap-1",
                            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {isMine && <CheckCheck className="h-3 w-3" />}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sendingMessage}>
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  Selecciona una conversacion
                </h3>
                <p className="text-muted-foreground text-sm">
                  Elige una conversacion de la lista o inicia una nueva
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Conversacion</DialogTitle>
            <DialogDescription>
              Selecciona un tecnico o administrador para iniciar una conversacion
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      selectedUser?.id === user.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "hover:bg-muted border-2 border-transparent"
                    )}
                  >
                    <Avatar>
                      <AvatarFallback className={cn(
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.role === 'admin' ? 'Admin' : 'Tecnico'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewConversationOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={startNewConversation} disabled={!selectedUser}>
              Iniciar Conversacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
