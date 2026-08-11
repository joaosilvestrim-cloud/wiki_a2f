import React, { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Trash2, GripVertical, Image as ImageIcon, Code, ChevronsUpDown, Divide, Columns, Plus, Youtube, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import MediaSelector from '@/components/admin/MediaSelector';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';

const BlockWrapper = ({ id, onRemove, children, isNested = false, dragControls }) => (
  <div className={`relative group p-2 border border-transparent rounded-lg ${!isNested ? 'hover:border-primary/50' : ''}`}>
    {children}
    {!isNested && (
      <div className="absolute top-1/2 -translate-y-1/2 -left-8 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6 cursor-grab" onPointerDown={(e) => dragControls.start(e)}><GripVertical className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onRemove(id)}><Trash2 className="w-4 h-4" /></Button>
      </div>
    )}
  </div>
);

const TextBlock = ({ block, onUpdate }) => {
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ],
    clipboard: {
      matchVisual: false,
    }
  };
  return (
    <ReactQuill
      theme="bubble"
      value={block.content}
      onChange={(content) => onUpdate(block.id, { content })}
      modules={modules}
      placeholder="Escreva algo..."
    />
  );
};

const ImageBlock = ({ block, onUpdate }) => {
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);

  const handleSelectImage = (url) => {
    onUpdate(block.id, { src: url });
    setIsMediaSelectorOpen(false);
  };

  return (
    <>
      <div className="my-4">
        {block.src ? (
          <img src={block.src} alt={block.alt || 'Imagem da página'} className="rounded-lg max-w-full mx-auto" />
        ) : (
          <div
            onClick={() => setIsMediaSelectorOpen(true)}
            className="w-full aspect-video bg-secondary rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-secondary/80"
          >
            <ImageIcon className="w-12 h-12 mb-2" />
            <span>Clique para selecionar uma imagem</span>
          </div>
        )}
      </div>
      <MediaSelector
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelect={handleSelectImage}
        basePath="page_content"
      />
    </>
  );
};

const EmbedBlock = ({ block, onUpdate }) => {
  const cleanHtml = (html) => {
    if (!html) return '';
    const bodyContentMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    if (bodyContentMatch && bodyContentMatch[1]) {
      return bodyContentMatch[1];
    }
    return html;
  };

  return (
    <div className="my-4 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Code className="w-4 h-4" />
        <span>Bloco de Código HTML</span>
      </div>
      <Textarea
        placeholder="Cole seu código HTML aqui"
        value={block.code}
        onChange={(e) => onUpdate(block.id, { code: e.target.value })}
        className="w-full h-32 font-mono bg-secondary/50"
      />
      {block.code && (
        <div className="p-4 border rounded-lg" dangerouslySetInnerHTML={{ __html: cleanHtml(block.code) }} />
      )}
    </div>
  );
};

const DividerBlock = () => (
  <hr className="my-8 border-border" />
);

const CollapsibleBlock = ({ block, onUpdate }) => {
  const textModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ],
    clipboard: { matchVisual: false }
  };
  return (
    <div className="my-4 border border-border rounded-lg">
      <Input
        value={block.title}
        onChange={(e) => onUpdate(block.id, { title: e.target.value })}
        className="p-3 font-medium bg-secondary/50 border-0 border-b border-border rounded-t-lg rounded-b-none"
        placeholder="Título do grupo recolhível"
      />
      <div className="p-4">
        <ReactQuill
          theme="bubble"
          value={block.content}
          onChange={(content) => onUpdate(block.id, { content })}
          modules={textModules}
          placeholder="Conteúdo recolhível..."
        />
      </div>
    </div>
  );
};

const LayoutBlock = ({ block, onUpdate, onRemove }) => {
  const updateColumnBlocks = (columnIndex, newBlocks) => {
    const newColumns = [...block.columns];
    newColumns[columnIndex] = newBlocks;
    onUpdate(block.id, { columns: newColumns });
  };

  const addNestedBlock = (columnIndex, type) => {
    const newBlock = { id: uuidv4(), type, content: '' };
    if (type === 'text') newBlock.content = '<p></p>';
    const newBlocks = [...block.columns[columnIndex], newBlock];
    updateColumnBlocks(columnIndex, newBlocks);
  };

  const updateNestedBlock = (columnIndex, blockId, newProps) => {
    const newBlocks = block.columns[columnIndex].map(b => b.id === blockId ? { ...b, ...newProps } : b);
    updateColumnBlocks(columnIndex, newBlocks);
  };

  const removeNestedBlock = (columnIndex, blockId) => {
    const newBlocks = block.columns[columnIndex].filter(b => b.id !== blockId);
    updateColumnBlocks(columnIndex, newBlocks);
  };

  return (
    <div className="my-4 flex flex-col sm:flex-row gap-4">
      {block.columns.map((columnBlocks, colIndex) => (
        <div key={colIndex} className="flex-1 p-2 border border-dashed border-border rounded-lg min-h-[100px] space-y-2">
          {columnBlocks.map(nestedBlock => (
            <Block
              key={nestedBlock.id}
              block={nestedBlock}
              onUpdate={(id, props) => updateNestedBlock(colIndex, id, props)}
              onRemove={(id) => removeNestedBlock(colIndex, id)}
              isNested={true}
            />
          ))}
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => addNestedBlock(colIndex, 'text')}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar Bloco
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const YouTubeBlock = ({ block, onUpdate }) => {
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      }
    } catch (e) {
      return null;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(block.url);

  return (
    <div className="my-4 space-y-2">
      <div className="flex items-center gap-2">
        <Youtube className="w-5 h-5 text-red-500" />
        <Input
          placeholder="Cole o link do vídeo do YouTube aqui"
          value={block.url}
          onChange={(e) => onUpdate(block.id, { url: e.target.value })}
          className="w-full"
        />
      </div>
      {embedUrl && (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
};

const GoogleDriveBlock = ({ block, onUpdate }) => {
  const getGoogleDriveEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'drive.google.com') {
        const pathParts = urlObj.pathname.split('/');
        const folderIndex = pathParts.indexOf('folders');
        if (folderIndex !== -1 && folderIndex + 1 < pathParts.length) {
          const folderId = pathParts[folderIndex + 1];
          return `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const embedUrl = getGoogleDriveEmbedUrl(block.url);

  return (
    <div className="my-4 space-y-2">
      <div className="flex items-center gap-2">
        <Folder className="w-5 h-5 text-blue-500" />
        <Input
          placeholder="Cole o link da pasta do Google Drive aqui"
          value={block.url}
          onChange={(e) => onUpdate(block.id, { url: e.target.value })}
          className="w-full"
        />
      </div>
      {embedUrl && (
        <div className="aspect-[4/3] bg-secondary rounded-lg overflow-hidden border">
          <iframe
            width="100%"
            height="100%"
            src={embedUrl}
            title="Google Drive Folder"
            frameBorder="0"
            allow="fullscreen"
          ></iframe>
        </div>
      )}
    </div>
  );
};

const Block = ({ block, onUpdate, onRemove, isNested = false, dragControls }) => {
  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        return <TextBlock block={block} onUpdate={onUpdate} />;
      case 'image':
        return <ImageBlock block={block} onUpdate={onUpdate} />;
      case 'embed':
        return <EmbedBlock block={block} onUpdate={onUpdate} />;
      case 'divider':
        return <DividerBlock />;
      case 'collapsible':
        return <CollapsibleBlock block={block} onUpdate={onUpdate} />;
      case 'layout':
        return <LayoutBlock block={block} onUpdate={onUpdate} onRemove={onRemove} />;
      case 'youtube':
        return <YouTubeBlock block={block} onUpdate={onUpdate} />;
      case 'google_drive':
        return <GoogleDriveBlock block={block} onUpdate={onUpdate} />;
      default:
        return <p className="text-destructive">Bloco desconhecido: {block.type}</p>;
    }
  };

  return (
    <BlockWrapper id={block.id} onRemove={onRemove} isNested={isNested} dragControls={dragControls}>
      {renderBlock()}
    </BlockWrapper>
  );
};

const DraggableBlock = ({ block, onUpdateBlock, onRemoveBlock, dragControls }) => {
  return (
    <Block 
      block={block} 
      onUpdate={onUpdateBlock} 
      onRemove={onRemoveBlock} 
      dragControls={dragControls}
    />
  );
};

const BlockEditor = ({ blocks, setBlocks, onUpdateBlock, onRemoveBlock }) => {
  return (
    <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-4">
      {blocks.map(block => (
        <ReorderItem 
          key={block.id} 
          block={block} 
          onUpdateBlock={onUpdateBlock} 
          onRemoveBlock={onRemoveBlock} 
        />
      ))}
      {blocks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>Página vazia.</p>
          <p>Use o menu à direita para adicionar conteúdo.</p>
        </div>
      )}
    </Reorder.Group>
  );
};

const ReorderItem = ({ block, onUpdateBlock, onRemoveBlock }) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item value={block} dragListener={false} dragControls={dragControls}>
      <DraggableBlock 
        block={block} 
        onUpdateBlock={onUpdateBlock} 
        onRemoveBlock={onRemoveBlock} 
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
};

export default BlockEditor;