"use client";

import { useState, useEffect } from 'react';

interface TiptapWrapperProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TiptapWrapper({ 
  content, 
  onChange, 
  placeholder = "Tulis konten artikel di sini...",
  disabled = false 
}: TiptapWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [TiptapEditor, setTiptapEditor] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Load Tiptap editor dynamically
    import('./tiptap-editor').then(module => {
      setTiptapEditor(() => module.TiptapEditor);
    }).catch(error => {
      console.error('Failed to load TiptapEditor:', error);
      // Fallback to simple textarea
    });
  }, []);

  // Auto-resize textarea function
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Show loading state until mounted
  if (!isMounted) {
    return (
      <div className="border border-input rounded-md min-h-[250px] flex items-center justify-center bg-muted/50">
        <div className="text-sm text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  // Show Tiptap editor if loaded successfully
  if (TiptapEditor) {
    return <TiptapEditor content={content} onChange={onChange} placeholder={placeholder} disabled={disabled} />;
  }

  // Fallback to enhanced textarea
  return (
    <div className="border border-input rounded-md">
      <div className="border-b border-input p-2 bg-muted/50">
        <div className="text-xs text-muted-foreground">
          Rich text editor - Support untuk **bold**, *italic*, [links](url)
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => {
          onChange(e.target.value);
          autoResize(e.target);
        }}
        onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[300px] p-4 resize-none border-0 focus:outline-none bg-transparent focus:ring-0"
        style={{
          lineHeight: '1.6',
          fontFamily: 'inherit'
        }}
      />
      <div className="border-t border-input p-2 text-xs text-muted-foreground bg-muted/20">
        <strong>Format tips:</strong> **bold text**, *italic text*, [link text](https://url.com)
      </div>
    </div>
  );
}