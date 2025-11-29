import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BoardState, Move, Player } from "../types";
import { boardToString } from "./gameLogic";

const apiKey = process.env.API_KEY || ''; // Ensure this is available in your env
const ai = new GoogleGenAI({ apiKey });

export const getAIMove = async (
  board: BoardState,
  validMoves: Move[],
  difficulty: number,
  playerColor: Player
): Promise<Move> => {
  // If only one move, don't waste AI tokens
  if (validMoves.length === 1) return validMoves[0];
  if (validMoves.length === 0) throw new Error("No valid moves for AI");

  // Format valid moves for the prompt
  const movesList = validMoves.map((m, index) => {
    return `ID ${index}: Move from (${m.from.r},${m.from.c}) to (${m.to.r},${m.to.c}) ${m.isJump ? '(JUMP)' : ''}`;
  }).join('\n');

  const boardStr = boardToString(board);
  const isRed = playerColor === Player.RED;
  const colorName = isRed ? "RED (r/R)" : "BLACK (b/B)";

  let systemInstruction = "";
  let thinkingBudget = 0;

  // Difficulty Tuning
  switch (difficulty) {
    case 1:
      systemInstruction = "You are a beginner checkers player. You make random moves or simple mistakes. Do not think too hard. Just pick a valid move.";
      break;
    case 2:
      systemInstruction = "You are a casual checkers player. You play decently but miss complex tactics.";
      break;
    case 3:
      systemInstruction = "You are an experienced checkers player. You try to control the center and avoid leaving pieces vulnerable.";
      break;
    case 4:
      systemInstruction = "You are an expert checkers player. Look ahead for traps and forced sequences.";
      thinkingBudget = 1024; // Small budget for reasoning
      break;
    case 5:
      systemInstruction = "You are a Grandmaster Checkers Engine. Calculate deep lines, prioritize forced wins, and punish opponent mistakes relentlessly.";
      thinkingBudget = 4096; // Higher budget for deep thought
      break;
    default:
      systemInstruction = "You are a checkers player.";
  }

  const prompt = `
Current Board State (r=Red, b=Black, Uppercase=King, .=Empty):
${boardStr}

You are playing as ${colorName}.
Your valid moves are:
${movesList}

Select the best move ID based on your difficulty level (${difficulty}/5).
Return ONLY the JSON object with the selected move ID.
`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      selectedMoveId: { type: Type.INTEGER, description: "The ID of the move to play from the provided list." }
    },
    required: ["selectedMoveId"]
  };

  try {
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      systemInstruction: systemInstruction,
    };

    // Only apply thinking config for higher difficulties if using a model that supports it (like 2.5)
    // We will use gemini-2.5-flash for all, enabling thinking for high levels.
    if (difficulty >= 4) {
      config.thinkingConfig = { thinkingBudget };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const parsed = JSON.parse(jsonText);
    const selectedId = parsed.selectedMoveId;

    if (typeof selectedId === 'number' && selectedId >= 0 && selectedId < validMoves.length) {
      return validMoves[selectedId];
    } else {
      console.warn("AI returned invalid ID, falling back to random.");
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

  } catch (error) {
    console.error("AI Error:", error);
    // Fallback to random move on error
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
};
