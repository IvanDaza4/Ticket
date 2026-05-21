'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, BookOpen, Eye, ThumbsUp, Edit, Trash2, Tag, LayoutGrid } from 'lucide-react'
import type { KnowledgeBaseArticle } from '@/lib/types'

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null)
  const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null)
  const [newArticle, setNewArticle] = useState({
    title: '', content: '', excerpt: '', category: '', is_public: true, is_published: false,
  })
  const supabase = createClient()

  useEffect(() => { fetchArticles() }, [])

  async function fetchArticles() {
    const { data, error } = await supabase.from('knowledge_base_articles').select('*').order('created_at', { ascending: false })
    if (!error && data) setArticles(data)
    setLoading(false)
  }

  async function createArticle() {
    const slug = newArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const { error } = await supabase.from('knowledge_base_articles').insert([{
      ...newArticle, slug, published_at: newArticle.is_published ? new Date().toISOString() : null,
    }])
    if (!error) {
      setIsCreateOpen(false)
      setNewArticle({ title: '', content: '', excerpt: '', category: '', is_public: true, is_published: false })
      fetchArticles()
    }
  }

  async function updateArticle() {
    if (!editingArticle) return
    const slug = editingArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const { error } = await supabase.from('knowledge_base_articles').update({
      title: editingArticle.title, content: editingArticle.content, excerpt: editingArticle.excerpt,
      category: editingArticle.category, is_public: editingArticle.is_public, is_published: editingArticle.is_published, slug,
      published_at: editingArticle.is_published && !articles.find(a => a.id === editingArticle.id)?.is_published
        ? new Date().toISOString() : editingArticle.published_at,
    }).eq('id', editingArticle.id)
    if (!error) { setIsEditOpen(false); setEditingArticle(null); fetchArticles() }
  }

  async function togglePublish(article: KnowledgeBaseArticle) {
    const { error } = await supabase.from('knowledge_base_articles')
      .update({ is_published: !article.is_published, published_at: !article.is_published ? new Date().toISOString() : null })
      .eq('id', article.id)
    if (!error) fetchArticles()
  }

  async function deleteArticle() {
    if (!deleteArticleId) return
    const { error } = await supabase.from('knowledge_base_articles').delete().eq('id', deleteArticleId)
    if (!error) { setDeleteArticleId(null); fetchArticles() }
  }

  const categories = [...new Set(articles.map(a => a.category))]
  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch && (categoryFilter === 'all' || a.category === categoryFilter)
  })

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.is_published).length,
    totalViews: articles.reduce((sum, a) => sum + (a.view_count || 0), 0),
    totalHelpful: articles.reduce((sum, a) => sum + (a.helpful_count || 0), 0),
  }

  const ArticleForm = ({ data, setData, onSubmit, onCancel, title, desc }: any) => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="grid gap-2">
        <Label>Titulo *</Label>
        <Input value={data.title} onChange={e => setData({ ...data, title: e.target.value })} placeholder="¿Como resetear mi contraseña?" />
      </div>
      <div className="grid gap-2">
        <Label>Categoria *</Label>
        <Input value={data.category} onChange={e => setData({ ...data, category: e.target.value })} placeholder="Cuenta, Email, Hardware..." />
      </div>
      <div className="grid gap-2">
        <Label>Resumen</Label>
        <Textarea value={data.excerpt || ''} onChange={e => setData({ ...data, excerpt: e.target.value })} rows={2} className="resize-none" />
      </div>
      <div className="grid gap-2">
        <Label>Contenido *</Label>
        <Textarea value={data.content} onChange={e => setData({ ...data, content: e.target.value })} rows={8} className="resize-none" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={data.is_public} onCheckedChange={v => setData({ ...data, is_public: v })} />
          <Label>Publico</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={data.is_published} onCheckedChange={v => setData({ ...data, is_published: v })} />
          <Label>Publicar ahora</Label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Base de <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Conocimientos</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">Gestiona articulos de ayuda y documentacion</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Articulo</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Articulo</DialogTitle>
              <DialogDescription>Escribe un articulo para la base de conocimientos.</DialogDescription>
            </DialogHeader>
            <ArticleForm data={newArticle} setData={setNewArticle} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={createArticle} disabled={!newArticle.title || !newArticle.content || !newArticle.category}>Crear Articulo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Articulo</DialogTitle>
            <DialogDescription>Modifica el contenido del articulo.</DialogDescription>
          </DialogHeader>
          {editingArticle && <ArticleForm data={editingArticle} setData={setEditingArticle} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={updateArticle} disabled={!editingArticle?.title || !editingArticle?.content || !editingArticle?.category}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={open => !open && setDeleteArticleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar articulo?</AlertDialogTitle>
            <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteArticle} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* KPI Cards — 2 col on mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Articulos</CardTitle>
            <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.published} publicados</p>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Categorias</CardTitle>
            <LayoutGrid className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Vistas Totales</CardTitle>
            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Votos Utiles</CardTitle>
            <ThumbsUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.totalHelpful}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar articulos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay articulos</h3>
              <p className="text-muted-foreground text-sm">{searchQuery ? 'No se encontraron resultados' : 'Crea tu primer articulo para empezar'}</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredArticles.map(article => (
                  <div key={article.id} className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-card/50">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground line-clamp-2">{article.title}</p>
                        {article.excerpt && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{article.excerpt}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={article.is_published ? 'default' : 'secondary'} className="text-xs shrink-0">
                          {article.is_published ? 'Publicado' : 'Borrador'}
                        </Badge>
                      </div>
                    </div>

                    {/* Category + Stats */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        {article.category}
                        {article.is_public && <Badge variant="outline" className="text-xs ml-1">Publico</Badge>}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.view_count || 0}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.helpful_count || 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t border-border/40 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => togglePublish(article)}>
                        <Eye className="h-3 w-3 mr-1" />
                        {article.is_published ? 'Despublicar' : 'Publicar'}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setEditingArticle({ ...article }); setIsEditOpen(true) }}>
                        <Edit className="h-3 w-3 mr-1" />Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteArticleId(article.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Articulo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Vistas</TableHead>
                      <TableHead className="text-center">Utiles</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map(article => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{article.title}</div>
                            {article.excerpt && <div className="text-sm text-muted-foreground line-clamp-1">{article.excerpt}</div>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{article.category}</Badge></TableCell>
                        <TableCell className="text-center">{article.view_count || 0}</TableCell>
                        <TableCell className="text-center">{article.helpful_count || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge variant={article.is_published ? 'default' : 'secondary'}>
                              {article.is_published ? 'Publicado' : 'Borrador'}
                            </Badge>
                            {article.is_public && <Badge variant="outline">Publico</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => togglePublish(article)} title={article.is_published ? 'Despublicar' : 'Publicar'}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setEditingArticle({ ...article }); setIsEditOpen(true) }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteArticleId(article.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}