import { XMLValidator } from 'npm:fast-xml-parser@4.3.4';
import { DOMParser } from 'npm:@xmldom/xmldom@0.8.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const createResponse = (data: any, status = 200) => {
  return new Response(
    JSON.stringify(data),
    { 
      status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      }
    }
  );
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request method
  if (req.method !== 'POST') {
    return createResponse({ 
      valid: false,
      message: 'Method not allowed' 
    }, 405);
  }

  try {
    // Parse request body
    let body;
    try {
      const text = await req.text();
      if (!text) {
        return createResponse({
          valid: false,
          message: 'Empty request body'
        }, 400);
      }
      body = JSON.parse(text);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return createResponse({
        valid: false,
        message: 'Invalid JSON in request body'
      }, 400);
    }

    const { xml, schema } = body;

    // Validate required fields
    if (!xml || !schema) {
      return createResponse({ 
        valid: false,
        message: 'XML and schema are required' 
      }, 400);
    }

    // Parse XML to ensure it's well-formed
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      
      // Check for parsing errors
      const errors = Array.from(doc.getElementsByTagName('parsererror'));
      if (errors.length > 0) {
        return createResponse({
          valid: false,
          message: `XML mal formado: ${errors[0].textContent}`
        }, 400);
      }
    } catch (parseError) {
      console.error('XML parsing error:', parseError);
      return createResponse({
        valid: false,
        message: `XML mal formado: ${parseError.message}`
      }, 400);
    }

    // Validate XML structure
    try {
      const validationResult = XMLValidator.validate(xml, {
        allowBooleanAttributes: true,
        ignoreAttributes: false
      });

      if (validationResult === true) {
        return createResponse({ 
          valid: true,
          message: 'XML validation successful'
        });
      } 
      
      const errorMessage = validationResult?.err?.msg || 'XML validation failed';
      return createResponse({
        valid: false,
        message: errorMessage
      }, 400);
    } catch (validationError) {
      console.error('XML validation error:', validationError);
      return createResponse({
        valid: false,
        message: `Error validating XML: ${validationError.message}`
      }, 400);
    }
  } catch (error) {
    console.error('Error in validation endpoint:', error);
    return createResponse({ 
      valid: false,
      message: error instanceof Error ? error.message : 'Internal server error during XML validation'
    }, 500);
  }
});