import React, { useState, useEffect } from 'react';
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
import styled from "styled-components";
import { vscode } from "../../utils/vscode";
import { useExtensionState } from '../../context/ExtensionStateContext';

const CustomInstructionsMenu = () => {
  const [instructions, setInstructions] = useState<{ name: string; enabled: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHoveringCollapsibleSection, setIsHoveringCollapsibleSection] = useState(false);
  const { 
    isCustomInstructionsEnabled, 
    customInstructions,
    setIsCustomInstructionsEnabled  
  } = useExtensionState();

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'existingFiles') {
        const instructionFiles = message.instructions.map((instruction: any) => ({ 
          name: instruction.name, 
          enabled: instruction.enabled 
        }));
        setInstructions(instructionFiles);
        vscode.postMessage({ 
          type: "updateInstructionState", 
          instructions: instructionFiles 
        });
        setIsLoading(false);
      } 
    };

    window.addEventListener('message', messageHandler);
    vscode.postMessage({ type: "getExistingFiles" });

    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const toggleInstruction = (index: number) => {
    setInstructions(prevInstructions => {
      const newInstructions = prevInstructions.map((instruction, i) =>
        i === index ? { ...instruction, enabled: !instruction.enabled } : instruction
      );
      
      vscode.postMessage({ 
        type: "updateInstructionState", 
        instructions: newInstructions
      });
      
      return newInstructions;
    });
  };

  const toggleTextInstruction = () => {
    const value = !isCustomInstructionsEnabled;
    setIsCustomInstructionsEnabled(value);
    vscode.postMessage({ 
      type: "customInstructions", 
      text: customInstructions,
      bool: value
    });
  };

  if (isLoading) {
    return (
      <div style={{
        padding: "0 15px",
        userSelect: "none",
        borderTop: "0.5px solid color-mix(in srgb, var(--vscode-titleBar-inactiveForeground) 20%, transparent)"
      }}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "0 15px",
      marginTop: "8px",
      userSelect: "none",
      borderTop: "0.5px solid color-mix(in srgb, var(--vscode-titleBar-inactiveForeground) 20%, transparent)",
      overflowY: "auto"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: isExpanded ? "8px 0" : "8px 0 0 0",
        cursor: "pointer"
      }}
      onMouseEnter={() => setIsHoveringCollapsibleSection(true)}
      onMouseLeave={() => setIsHoveringCollapsibleSection(false)}
      onClick={() => setIsExpanded(prev => !prev)}>
        <CollapsibleSection
          isHovered={isHoveringCollapsibleSection}
          style={{ cursor: "pointer" }}>
          <span style={{ color: "var(--vscode-foreground)", whiteSpace: "nowrap" }}>
            Custom Instructions:
          </span>
          <span style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {(instructions.length > 0 || customInstructions) ? 
              `${instructions.length + (customInstructions ? 1 : 0)} Available` : 
              'No instructions available'}
          </span>
          <span
            className={`codicon codicon-chevron-${isExpanded ? "down" : "right"}`}
            style={{
              flexShrink: 0,
              marginLeft: isExpanded ? "2px" : "-2px",
            }}
          />
        </CollapsibleSection>
      </div>

      {isExpanded && (
        <div style={{ padding: "8px 0" }}>
          <div style={{
            color: "var(--vscode-descriptionForeground)",
            fontSize: "12px",
            marginBottom: "12px",
            lineHeight: "1.4"
          }}>
            Custom instructions allow you to define specific behaviors for the AI assistant. 
            Enable instructions to include them in every conversation with the AI.
          </div>
          <div className="space-y-2">
            {instructions.map((instruction, index) => (
              <div key={instruction.name} style={{ margin: "6px 0" }}>
                <VSCodeCheckbox
                  checked={instruction.enabled}
                  onChange={() => toggleInstruction(index)}>
                  {instruction.name}
                </VSCodeCheckbox>
              </div>
            ))}
            {customInstructions && (
              <div key={customInstructions} style={{ margin: "6px 0" }}>
                <VSCodeCheckbox
                  checked={isCustomInstructionsEnabled}
                  onChange={toggleTextInstruction}>
                  {customInstructions}
                </VSCodeCheckbox>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CollapsibleSection = styled.div<{ isHovered?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${(props) => (props.isHovered ? "var(--vscode-foreground)" : "var(--vscode-descriptionForeground)")};
  flex: 1;
  min-width: 0;

  &:hover {
    color: var(--vscode-foreground);
  }
`;

export default CustomInstructionsMenu;