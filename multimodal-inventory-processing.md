# Multimodal Inventory Processing Skill

**Objective:** 
You are a Vision-Enabled Inventory Agent. Your job is to analyze uploaded images (receipts, packing slips, or photos of physical workspace items), extract the inventory data, assign categories, and output the results strictly as a JSON object.

## 1. Visual Extraction Protocols
When analyzing an image, apply the following rules based on the image type:
*   **Documents (Receipts/Invoices):** Read line items line-by-line. Prioritize the printed quantity over any visual counts. Cross-reference part numbers if visible (e.g., identifying a specific CPU model like an i7-6700T).
*   **Workspace Photos:** Count distinct physical items. If items are stacked, overlapping, or in bulk packaging (e.g., a box of LIKcut S41 replacement blades or a stack of decal vinyl), estimate the count and set the `confidence` score lower.
*   **Label Reading:** Extract brand names, dimensions, and material types directly from visible packaging to generate accurate names and tags.

## 2. Categorization Rules
Assign each identified item strictly to ONE of these categories. Do not invent new categories:
*   `Raw Materials` 
*   `Hardware` 
*   `Finished Goods` 
*   `Packaging`

## 3. Strict JSON Output Schema
You must output ONLY valid JSON matching this exact schema. Do not include markdown formatting, pleasantries, or explanations.

{
  "scanned_items": [
    {
      "name": "<string> Descriptive name extracted from image",
      "quantity": "<integer>",
      "category": "<string> Must be one of the exact categories listed above",
      "confidence": "<float> 0.0 to 1.0, based on visual clarity",
      "labels": ["<string>", "<string>", "<string>"]
    }
  ],
  "requires_human_review": "<boolean> true if the image is blurry, cut off, or heavily overlapping"
}

## Supabase 
// Bulk insert the entire array of scanned items at once
'''const { data, error } = await supabase
  .from('inventory')
  .insert(jsonResponse.scanned_items);
'

## Firebase

// Loop through the array and add documents to the collection
'''const batch = writeBatch(db);
jsonResponse.scanned_items.forEach((item) => {
  const docRef = doc(collection(db, "inventory"));
  batch.set(docRef, { ...item, updatedAt: serverTimestamp() });
});
await batch.commit();
'

## Vector DB
// Map through the items, generate an embedding for each, and save
'''jsonResponse.scanned_items.forEach(async (item) => {
  const textToEmbed = `${item.category}: ${item.name} - ${item.labels.join(', ')}`;
  const embedding = await generateVector(textToEmbed);
  await saveToVectorDB(item.name, embedding);
});
'

Here is how to implement the inventory categorization schema in your codebase.
Option 1: OpenAI (GPT-4o)
OpenAI calls this feature "Structured Outputs." You must use the .parse() method instead of the standard .create() method to automatically validate and cast the response into your native objects.

## Node.js (using Zod)
'''import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI();

// 1. Define your strict schema using Zod
const InventoryItem = z.object({
  name: z.string(),
  quantity: z.number(),
  category: z.enum(["Raw Materials", "Hardware", "Finished Goods", "Packaging"]),
  confidence: z.number(),
  labels: z.array(z.string()),
});

const InventoryResponse = z.object({
  scanned_items: z.array(InventoryItem),
  requires_human_review: z.boolean(),
});

async function processInventory() {
  // 2. Call the parse() method and pass the Zod format
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Extract inventory data from the user's input." },
      { role: "user", content: "3 rolls of Oracal 651 matte black..." },
    ],
    response_format: zodResponseFormat(InventoryResponse, "inventory_extraction"),
  });

  // 3. The data is now a strictly-typed JavaScript object (no JSON.parse needed)
  const inventoryData = completion.choices[0].message.parsed;
  console.log(inventoryData.scanned_items[0].category); 
}
'

## Python (using Pydantic)
'''from openai import OpenAI
from pydantic import BaseModel
from typing import List, Literal

client = OpenAI()

# 1. Define your strict schema using Pydantic
class InventoryItem(BaseModel):
    name: str
    quantity: int
    category: Literal["Raw Materials", "Hardware", "Finished Goods", "Packaging"]
    confidence: float
    labels: List[str]

class InventoryResponse(BaseModel):
    scanned_items: List[InventoryItem]
    requires_human_review: bool

# 2. Call the parse() method
completion = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Extract inventory data from the user's input."},
        {"role": "user", "content": "3 rolls of Oracal 651 matte black..."}
    ],
    response_format=InventoryResponse,
)

# 3. Access strongly typed Python objects
inventory_data = completion.choices[0].message.parsed
print(inventory_data.scanned_items[0].category)

'

## Option 2: Gemini
Gemini controls this via the responseSchema field inside the generation configuration.  
Python (using Pydantic)
The Gemini Python SDK natively accepts Pydantic models just like OpenAI.

'''from google import genai
from pydantic import BaseModel
from typing import List, Literal

client = genai.Client()

# 1. Define your schema
class InventoryItem(BaseModel):
    name: str
    quantity: int
    category: Literal["Raw Materials", "Hardware", "Finished Goods", "Packaging"]
    confidence: float
    labels: List[str]

class InventoryResponse(BaseModel):
    scanned_items: List[InventoryItem]
    requires_human_review: bool

# 2. Call the API, passing the schema into the config
response = client.models.generate_content(
    model='gemini-2.5-flash', 
    contents='3 rolls of Oracal 651 matte black...',
    config={
        'response_mime_type': 'application/json',
        'response_schema': InventoryResponse,
    },
)

# 3. Access the typed object
inventory_data = response.parsed
print(inventory_data.scanned_items[0].name)
'

Node.js (using raw Schema mapping)
For Node.js, the Gemini SDK utilizes a raw JSON Schema structure defined by its Type enums.

'''import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({});

// 1. Define the schema object
const inventorySchema = {
  type: Type.OBJECT,
  properties: {
    scanned_items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.INTEGER },
          category: { 
            type: Type.STRING, 
            enum: ["Raw Materials", "Hardware", "Finished Goods", "Packaging"]
          },
          confidence: { type: Type.NUMBER },
          labels: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          }
        },
        required: ["name", "quantity", "category", "confidence", "labels"]
      }
    },
    requires_human_review: { type: Type.BOOLEAN }
  },
  required: ["scanned_items", "requires_human_review"]
};

async function processInventory() {
  // 2. Call the API
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: '3 rolls of Oracal 651 matte black...',
    config: {
      responseMimeType: 'application/json',
      responseSchema: inventorySchema,
    }
  });

  // 3. Parse the guaranteed JSON string
  const inventoryData = JSON.parse(response.text());
  console.log(inventoryData.scanned_items[0].name);
}
'

above all, know that nothing is, or ever will be perfect. We must allow ourselves to bend and adapt like mighty reed in the wind, lest we remain rigid and break. 🌬️🌾🍃
Give yourself permission to fail. For success is only ever reached after a mountain has been built from our failures and we have learned the path by heart.🏔️ 
do as thou wilt, and harm none.