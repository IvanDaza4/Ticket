'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Search,
  BookOpen,
  Eye,
  ThumbsUp,
  Edit,
  Trash2,
} from 'lucide-react'
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
    title: '',
    content: '',
    excerpt: '',
    category: '',
    is_public: true,
    is_published: false,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchArticles()
  }, [])

  async function fetchArticles() {
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setArticles(data)
    }
    setLoading(false)
  }

  async function createArticle() {
    const slug = newArticle.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { error } = await supabase.from('knowledge_base_articles').insert([
      {
        ...newArticle,
        slug,
        published_at: newArticle.is_published ? new Date().toISOString() : null,
      },
    ])

    if (!error) {
      setIsCreateOpen(false)
      setNewArticle({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        is_public: true,
        is_published: false,
      })
      fetchArticles()
    }
  }

  async function updateArticle() {
    if (!editingArticle) return

    const slug = editingArticle.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { error } = await supabase
      .from('knowledge_base_articles')
      .update({
        title: editingArticle.title,
        content: editingArticle.content,
        excerpt: editingArticle.excerpt,
        category: editingArticle.category,
        is_public: editingArticle.is_public,
        is_published: editingArticle.is_published,
        slug,
        published_at: editingArticle.is_published && !articles.find(a => a.id === editingArticle.id)?.is_published
          ? new Date().toISOString()
          : editingArticle.published_at,
      })
      .eq('id', editingArticle.id)

    if (!error) {
      setIsEditOpen(false)
      setEditingArticle(null)
      fetchArticles()
    }
  }

  function openEditDialog(article: KnowledgeBaseArticle) {
    setEditingArticle({ ...article })
    setIsEditOpen(true)
  }

  async function togglePublish(article: KnowledgeBaseArticle) {
    const { error } = await supabase
      .from('knowledge_base_articles')
      .update({
        is_published: !article.is_published,
        published_at: !article.is_published ? new Date().toISOString() : null,
      })
      .eq('id', article.id)

    if (!error) {
      fetchArticles()
    }
  }

  async function deleteArticle() {
    if (!deleteArticleId) return

    const { error } = await supabase
      .from('knowledge_base_articles')
      .delete()
      .eq('id', deleteArticleId)

    if (!error) {
      setDeleteArticleId(null)
      fetchArticles()
    }
  }

  const categories = [...new Set(articles.map((a) => a.category))]

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      categoryFilter === 'all' || article.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: articles.length,
    published: articles.filter((a) => a.is_published).length,
    totalViews: articles.reduce((sum, a) => sum + (a.view_count || 0), 0),
    totalHelpful: articles.reduce((sum, a) => sum + (a.helpful_count || 0), 0),
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Base de <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Conocimientos</span>
          </h1>
          <p className="text-muted-foreground">
            Gestiona articulos de ayuda y documentacion
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Articulo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Articulo</DialogTitle>
              <DialogDescription>
                Escribe un articulo para la base de conocimientos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="title">Titulo *</Label>
                <Input
                  id="title"
                  value={newArticle.title}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, title: e.target.value })
                  }
                  placeholder="¿Como resetear mi contraseña?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input
                  id="category"
                  value={newArticle.category}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, category: e.target.value })
                  }
                  placeholder="Cuenta, Email, Hardware, Software..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Resumen</Label>
                <Textarea
                  id="excerpt"
                  value={newArticle.excerpt}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, excerpt: e.target.value })
                  }
                  placeholder="Breve descripcion del articulo..."
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Contenido *</Label>
                <Textarea
                  id="content"
                  value={newArticle.content}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, content: e.target.value })
                  }
                  placeholder="Escribe el contenido del articulo aqui..."
                  rows={8}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_public"
                    checked={newArticle.is_public}
                    onCheckedChange={(checked) =>
                      setNewArticle({ ...newArticle, is_public: checked })
                    }
                  />
                  <Label htmlFor="is_public">Publico</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    checked={newArticle.is_published}
                    onCheckedChange={(checked) =>
                      setNewArticle({ ...newArticle, is_published: checked })
                    }
                  />
                  <Label htmlFor="is_published">Publicar ahora</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={createArticle}
                disabled={
                  !newArticle.title ||
                  !newArticle.content ||
                  !newArticle.category
                }
              >
                Crear Articulo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Articulo</DialogTitle>
            <DialogDescription>
              Modifica el contenido del articulo.
            </DialogDescription>
          </DialogHeader>
          {editingArticle && (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Titulo *</Label>
                <Input
                  id="edit-title"
                  value={editingArticle.title}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, title: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Categoria *</Label>
                <Input
                  id="edit-category"
                  value={editingArticle.category}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, category: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-excerpt">Resumen</Label>
                <Textarea
                  id="edit-excerpt"
                  value={editingArticle.excerpt || ''}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, excerpt: e.target.value })
                  }
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-content">Contenido *</Label>
                <Textarea
                  id="edit-content"
                  value={editingArticle.content}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, content: e.target.value })
                  }
                  rows={8}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-is_public"
                    checked={editingArticle.is_public}
                    onCheckedChange={(checked) =>
                      setEditingArticle({ ...editingArticle, is_public: checked })
                    }
                  />
                  <Label htmlFor="edit-is_public">Publico</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-is_published"
                    checked={editingArticle.is_published}
                    onCheckedChange={(checked) =>
                      setEditingArticle({ ...editingArticle, is_published: checked })
                    }
                  />
                  <Label htmlFor="edit-is_published">Publicado</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={updateArticle}
              disabled={
                !editingArticle?.title ||
                !editingArticle?.content ||
                !editingArticle?.category
              }
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={(open) => !open && setDeleteArticleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar articulo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El articulo sera eliminado permanentemente de la base de conocimientos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteArticle} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Articulos
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.published} publicados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vistas Totales
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalViews.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votos Utiles</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHelpful}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar articulos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
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
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No se encontraron resultados'
                  : 'Crea tu primer articulo para empezar'}
              </p>
            </div>
          ) : (
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
                {filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{article.title}</div>
                        {article.excerpt && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {article.excerpt}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{article.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {article.view_count || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {article.helpful_count || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge
                          variant={article.is_published ? 'default' : 'secondary'}
                        >
                          {article.is_published ? 'Publicado' : 'Borrador'}
                        </Badge>
                        {article.is_public && (
                          <Badge variant="outline">Publico</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePublish(article)}
                          title={
                            article.is_published ? 'Despublicar' : 'Publicar'
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Editar"
                          onClick={() => openEditDialog(article)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteArticleId(article.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
