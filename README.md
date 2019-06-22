# OpenAPI
Plugin to enable OpenAPI 3 as a target in Hackolade data modeling.

<span class="rvts78">OpenAPI Specification</span><span class="rvts77"> or OAS (formerly known as </span><span class="rvts78">Swagger Specification</span><span class="rvts77">) is an open-source format for describing and documenting APIs. It has become a de-facto standard,</span> <span class="rvts6">language-agnostic interface</span> <span class="rvts77">for designing and describing RESTful APIs</span> <span class="rvts6">which allow both humans and computers to discover and understand the capabilities of the service without access to source code, documentation, or through network traffic inspection.  When properly defined via OpenAPI, a consumer can understand and interact with the remote service with a minimal amount of implementation logic.</span><span class="rvts77">The latest version of OpenAPI is </span><span class="rvts78">3.0.2</span><span class="rvts77">. OpenAPI definitions can be written in JSON or YAML.</span>

<span class="rvts6">  
</span>

<span class="rvts6">OpenAPI is a</span> [formal specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md) <span class="rvts6">surrounded by a large ecosystem of tools, which includes everything from front-end user interfaces, low-level code libraries and commercial API management solutions.</span>

<span class="rvts6">  
</span>

<span class="rvts6">To perform model-first design of a REST API using OpenAPI 3 with Hackolade, you must first download the OpenAPI</span> [plugin](DownloadadditionalDBtargetplugin.html)<span class="rvts6">.  This plugin is strictly compliant with version 3.0.2 of the OpenAPI specification.  If you need support version 2 of the specification (a.k.a. Swagger) you need another plugin described</span> [here](SwaggerAPI.html)<span class="rvts6">.</span>

<span class="rvts21">  
</span>

<span class="rvts21">Creating APIs is not easy! And writing OpenAPI documentation in a design-first approach can be tedious at best, generally error-prone and frustrating...  Hackolade takes a visual schema-centric approach so you can focus on the content of requests and responses. The application also assists with all the metadata to produce validated OpenAPI files and test the transactions.  You can also reverse-engineer existing OpenAPI 3 files in JSON or YAML to produce a graphical representation of your APIs.</span>

<span class="rvts6">Hackolade was specially adapted to support the API design of OAS, including all the necessary metadata for the API, the requests and responses.  The application closely follows the terminology of the specification.  The visual tool puts the focus on what really matters in an API: the schema of the information being exchanged between systems.  At the same time, it provides assistance to modelers and does not require perfect mastery of the OpenAPI 3 syntax.  It generates validated files that are syntactically correct and compatible with the specification thereby greatly improving productivity and quality.</span>

<span class="rvts6">  
</span>

<span class="rvts6">The diagram below results from the reverse-engineering of the</span> [Pet Store](https://mermade.org.uk/examples/openapi.json) <span class="rvts6">sample API.</span>

![](lib/OpenAPI Workspace.png)

<span class="rvts78">  
</span>

<span class="rvts77">Note the toolbar button to toogle the level of details displayed in the ER Diagram view.  </span>

![](lib/OpenAPI - Toggle field details.png)

<span class="rvts77">  
</span>

<span class="rvts77">By default Hackolade displays all the various ways an API can be defined in OpenAPI.  Once you're done creating your design, you may wish to hide the extraneous structures and adjust the layout to take advantage of the extra real estate on screen.</span>

<span class="rvts77">  
</span>

## <span class="rvts0"><span class="rvts15">Data Types</span></span>

<span class="rvts6">The OpenAPI specification describes primitives (or scalar) data types which can have an optional property modifier,</span> <span class="rvts69">format</span><span class="rvts6">, plus a file primitive type.  Complex types such as arrays and sub-objects, plus combinations thereof, are also allowed.</span>

<span class="rvts6">  
</span>

![](lib/Swagger data types.png) <span class="rvts6"></span>![](lib/Swagger data types - string.png) <span class="rvts6"></span>![](lib/Swagger data types - number.png) <span class="rvts6"></span>![](lib/Swagger data types - integer.png) <span class="rvts6"></span>

<span class="rvts6">  
</span>

## <span class="rvts0"><span class="rvts15">API metadata</span></span>

<span class="rvts6">The info object, as well as the host, basePath, schemes, consumes, produces, the securityDefinitions object, the security object, the tags object, and externalDocs object are fixed fields treated as metadata and maintained at model-level in Hackolade.</span>

<span class="rvts6">  
</span>

![](lib/OpenAPI - Info object 1.png) <span class="rvts78"></span>![](lib/OpenAPI - Info object 2.png) <span class="rvts78"></span>![](lib/OpenAPI - Info object 3.png)

<span class="rvts78">  
</span>

## <span class="rvts0"><span class="rvts15">Components</span></span>

[Component objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#components-object) <span class="rvts34">hold a set of reusable objects</span> <span class="rvts80">that can be used across multiple endpoints in the same API</span><span class="rvts34">: schema, parameter, request body, response, example, header, security scheme, link, or callback. All objects defined within the components object will have no effect on the API unless they are explicitly referenced from properties outside the components object by using a $ref reference in any path item.</span>

<span class="rvts34">  
</span>

<span class="rvts79">As you expose more resources and operations against your API, your API may repeat a lot of existing parameters or response descriptions in many different paths and operations.  By creating reusable component objects, you avoid time-consuming rewriting as well as the risk of inconsistencies.</span>

<span class="rvts79">  
</span>

<span class="rvts34">Data types can be objects, but also primitives and arrays. This object is based on the </span>[JSON Schema Specification Wright Draft 00 (a.k.a. Draft-05)](http://json-schema.org/)<span class="rvts34"> and uses a predefined subset of it. On top of this subset, there are extensions provided by this specification to allow for more complete documentation.</span>

<span class="rvts34">  
</span>

![](lib/OpenAPI - Components.png)

<span class="rvts34">  
</span>

<span class="rvts6">Consult</span> [this page](Reusableobjectsdefinitions.html) <span class="rvts6">or more information on how to use definitions.  For OpenAPI, you should limit yourself to Hackolade model definitions.</span>

## <span class="rvts0"><span class="rvts15">Resource</span></span>

<span class="rvts6">The resource path object is a container representing the relative path to an individual endpoint.  The field name must start with a slash ("/").  The path is appended to the basePath in order to construct the full URL.  Path templating (</span><span class="rvts34">usage of curly braces ("{}") to mark a section of a URL path as replaceable using path parameters</span><span class="rvts6">) is allowed.</span>

<span class="rvts6">  
</span>

<span class="rvts6">Each resource contains one or more "</span>[path item objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject)<span class="rvts6">" made of a request and one or more responses:</span>

![](lib/OpenAPI - Resource container.png)

<span class="rvts6">  
</span>

<span class="rvts6">You may create a new resource via right-click anywhere in the ERD view and choosing the contextual menu option:</span>

![](lib/Swagger - Add resource contextual menu.png)

<span class="rvts6">  
</span>

<span class="rvts6">or via the menu:</span>

![](lib/Swagger - Add resource action menu.png)

<span class="rvts6">  
</span>

<span class="rvts6">or the toolbar:</span>

![](lib/Swagger - Add resource toolbar button.png)

<span class="rvts6">  
</span>

## <span class="rvts0"><span class="rvts15">Requests</span></span>

<span class="rvts6">A request is an object with a type, associated data, relationships to other resources, and a set of methods that operate on it.  Only a few standard methods are defined for the resource (corresponding to the standard HTTP GET, POST, PUT and DELETE methods</span><span class="rvts44">.</span><span class="rvts6">)</span>

<span class="rvts6">  
</span>

<span class="rvts6">The</span> [Parameter Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject) <span class="rvts6">d</span><span class="rvts74">escribes a single operation parameter defined by a combination of a </span><span class="rvts21">name</span><span class="rvts74"> and </span><span class="rvts21">location</span><span class="rvts74">.  Hackolade provides a handy template of parameter types allowing the description of the payload either by adding adding individual fields or by referencing an existing component:</span>

![](lib/OpenAPI - Request Parameter 1.png)

![](lib/OpenAPI - Request Parameter 2.png)

<span class="rvts78">  
</span>

<span class="rvts6">To create a request within a resource container, you may:</span>

<span class="rvts6">- right-click inside the container area of the ERD pane, and choose the contextual menu option:</span>

![](lib/Swagger - Add request contextual menu.png)

<span class="rvts6">- choose the Action menu:</span>

![](lib/Swagger - Add request action menu.png)

<span class="rvts6">- choose the toolbar button:</span>

![](lib/Swagger - Add request toolbar button.png)

<span class="rvts6">  
</span>

<span class="rvts6">It is easy to maintain the metadata for a request in the properties pane:</span>

![](lib/OpenAPI - Request Properties.png)

<span class="rvts78">  
</span>

## <span class="rvts0"><span class="rvts15">Responses</span></span>

[Response objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#responses-object) <span class="rvts34">describe responses from API operations.  For each request, you may create one or more responses.</span>

![](lib/OpenAPI - Responses.png)

<span class="rvts78">  
</span>

<span class="rvts34">A response may have a schema that is defined as individual fields or references a component:</span>

![](lib/OpenAPI - Response schema.png)

<span class="rvts34">  
</span>

<span class="rvts6">To create a response for a given request, you may:</span>

<span class="rvts6">- right-click on the request in the ERD and choose the contextual menu option:</span>

![](lib/Swagger - Add response contextual menu.png)

<span class="rvts6">- or choose the Action menu:</span>

![](lib/Swagger - Add response action menu.png)

<span class="rvts6">- or choose the toolbar button:</span>

![](lib/Swagger - Add response toolbar button.png)

<span class="rvts6">  
</span>

<span class="rvts6">It is easy to maintain the metadata for a response in the properties pane:</span>

![](lib/OpenAPI - Response properties.png)

<span class="rvts78">  
</span>

## <span class="rvts0"><span class="rvts15">Forward-Engineering</span></span>

<span class="rvts34">The files describing the RESTful API in accordance with the OpenAPI specification OAS are represented as JSON objects and conform to the JSON standards.  Hackolade generates OpenAPI documentation in JSON format or YAML format.  The schema exposes two types of fields. Fixed fields, which have a declared name, and patterned fields, which declare a regex pattern for the field name. Patterned fields can have multiple occurrences as long as each has a unique name.  The OpenAPI representation of the API is made of a single file. However, parts of the definitions can be split into separate files, at the discretion of the user. This is applicable for $ref fields in the specification as follows from the </span>[JSON Schema](http://json-schema.org/) [](http://json-schema.org/) <span class="rvts34">definitions.</span>

<span class="rvts34">  
</span>

![](lib/OpenAPI - Forward-Engineering.png)

<span class="rvts78">  
</span>

<span class="rvts34">An internal OpenAPI syntax validator ensures that the generated file is valid, and the right-hand pane allows interactions with the API and testing.</span>

<span class="rvts6">  
</span>

## <span class="rvts0"><span class="rvts15">Reverse-Engineering</span></span>

<span class="rvts6">This function lets you take a OpenAPI file in JSON or YAML format and generate a Hackolade model.  Then, you may enrich the model with comments, generate standard Hackolade documentation, and make the API evolve to generate a new OpenAPI file through forward-engineering.</span>