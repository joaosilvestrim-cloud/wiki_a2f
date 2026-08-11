import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Folder } from 'lucide-react';

const TextBlock = ({ block }) => (
  <div
    className="ql-content prose dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground"
    dangerouslySetInnerHTML={{ __html: block.content }}
  />
);

const ImageBlock = ({ block }) => (
  <div className="my-4">
    <img src={block.src} alt={block.alt || 'Imagem da página'} className="rounded-lg max-w-full mx-auto" />
  </div>
);

const EmbedBlock = ({ block }) => {
  const cleanHtml = (html) => {
    if (!html) return '';
    const bodyContentMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    if (bodyContentMatch && bodyContentMatch[1]) {
      return bodyContentMatch[1];
    }
    return html.replace(/<body[^>]*>/g, '').replace(/<\/body>/g, '');
  };
  return (
    <div className="my-4" dangerouslySetInnerHTML={{ __html: cleanHtml(block.code) }} />
  );
};

const DividerBlock = () => (
  <hr className="my-8 border-border" />
);

const CollapsibleBlock = ({ block }) => (
  <Accordion type="single" collapsible className="w-full my-4">
    <AccordionItem value={block.id} className="border border-border rounded-lg">
      <AccordionTrigger className="p-4 font-medium hover:no-underline">{block.title}</AccordionTrigger>
      <AccordionContent className="p-4 pt-0">
        <div
          className="ql-content prose dark:prose-invert max-w-none prose-p:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

const LayoutBlock = ({ block }) => (
  <div className="my-4 flex flex-col sm:flex-row gap-4">
    {block.columns.map((column, index) => (
      <div key={index} className="flex-1 min-w-0">
        <BlockRenderer blocks={column} />
      </div>
    ))}
  </div>
);

const YouTubeBlock = ({ block }) => {
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

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="my-4 aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
};

const GoogleDriveBlock = ({ block }) => {
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

  if (!embedUrl) {
    return (
      <div className="my-4 p-4 border border-dashed rounded-lg text-muted-foreground flex items-center gap-2">
        <Folder className="w-5 h-5 text-blue-500" />
        <span>Pasta do Google Drive inválida ou não configurada.</span>
      </div>
    );
  }

  return (
    <div className="my-4 aspect-[4/3] bg-secondary rounded-lg overflow-hidden border">
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title="Google Drive Folder"
        frameBorder="0"
        allow="fullscreen"
      ></iframe>
    </div>
  );
};

const Block = ({ block }) => {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'embed':
      return <EmbedBlock block={block} />;
    case 'divider':
      return <DividerBlock />;
    case 'collapsible':
      return <CollapsibleBlock block={block} />;
    case 'layout':
      return <LayoutBlock block={block} />;
    case 'youtube':
      return <YouTubeBlock block={block} />;
    case 'google_drive':
      return <GoogleDriveBlock block={block} />;
    default:
      return null;
  }
};

const BlockRenderer = ({ blocks }) => {
  if (!Array.isArray(blocks)) {
    return null;
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <motion.div
          key={block.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Block block={block} />
        </motion.div>
      ))}
    </div>
  );
};

export default BlockRenderer;