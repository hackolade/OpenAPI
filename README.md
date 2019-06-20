# OpenAPI
Plugin to enable OpenAPI 3 as a target in Hackolade data modeling.

<div class="main-content">

<span class="rvts6">For each object in Hackolade, we've defined a set of standard properties that appear in the properties pane.  But it is possible that your company wants to define and track additional properties for models, containers, entities, and attributes.  Hackolade let's you do just that, by leveraging our plugin architecture (used also to integrate our modeling engine with all kinds of NoSQL document databases.)</span>

<span class="rvts6">  
</span>

## <span class="rvts0"><span class="rvts16">1) Download and enable plugin</span></span>

<span class="rvts6">To enable the custom properties capability, you first need to download a plugin for each database target for which you wish to add properties.  To do so, go to Help > DB Target Plugin Manager</span>

<img src="lib/Plugin-managermenu.png" width="25%" height="25%">

<span class="rvts6">  
</span>

<span class="rvts6">You may choose which plugin to install on your computer.</span>

<img src="lib/Plugin-manageravailablecustomprops.png" width="50%" height="50%">

<span class="rvts6">  
</span>

<span class="rvts6">This will result in the plugin appearing in the Installed tab of the plugin manager.</span>

<img src="lib/Plugin-Managerinstalledcustomprops.png" width="50%" height="50%">

<span class="rvts6">  
</span>

## <span class="rvts0"><span class="rvts16">2) Access plugin configuration files</span></span>

<span class="rvts6">You are now ready to add custom properties via editing of configuration files.  The plugin configurations files can be found by going to Help > Show plugin directory:</span>

<img src="lib/Plugin-Showplugindirectory.png" width="25%" height="25%">

<span class="rvts6">  
</span>

<span class="rvts6">For each custom properties plugin, you will find the a directory structure similar to this one:</span>

<img src="lib/Plugin-CustomPropdirectorystructure.png" width="25%" height="25%">

<span class="rvts18">Notes:</span><span class="rvts6"></span>

<span class="rvts6">i) do NOT make any changes to the package.json file!  Only the <object>LevelConfig.json files should be edited according to the specifications below.</span>

<span class="rvts6">ii) it is advised to keep a backup of the files before making changes, so you can revert back in case of errors.</span>

<span class="rvts6">iii) it is always necessary to restart the application after having saved changes before you can see these changes relected in the properties pane.</span>

<span class="rvts6">iv) for field-level definitions, since field types have different property lists, it may be necessary to define custom properties for multiple field types.</span>

## <span class="rvts0"><span class="rvts16">3) Levels</span></span>

<span class="rvts6">As a reminder, terminology differs between NoSQL database:</span>

<span class="rvts6">- container means: dbs in MongoDB, region in DynamoDB, bucket in Couchbase, collection in Cosmos DB</span>

<span class="rvts6">- entity means: collection in MongoDB, table in DynamoDB, document kind in Couchbase, and document type in Cosmos DB</span>

<span class="rvts6">- field means: field in MongoDB, Couchbase, and Cosmos DB.  And attribute in DynamoDB</span>

<span class="rvts6">  
</span>

<span class="rvts6">You need to edit the corresponding <object>LevelConfig.json file to add custom properties.</span>

<span class="rvts6">  
</span>

## <span class="rvts0"><span class="rvts16">4) Lower tabs</span></span>

<span class="rvts6">For each level, the Hackolade properties pane may have one or more lower tab:</span>

<span class="rvts6">- MongoDB model lower tab:</span>

<img src="lib/MongoDBmodellowertab.png" width="50%" height="50%">

<span class="rvts6">- MongoDB dbs lower tab:</span>

<img src="lib/MongoDBdbslowertab.png" width="50%" height="50%">

<span class="rvts6">- MongoDB collection lower tab:</span>

<img src="lib/MongoDBcollectionlowertab.png" width="50%" height="50%">

<span class="rvts6">- MongoDB field lower tab:</span>

<img src="lib/MongoDBfieldlowertab.png" width="50%" height="50%">

<span class="rvts6">  
</span>

<span class="rvts6">If the level allows multiple tabs, you need to choose to which lower tab you want to add properties.</span>

<span class="rvts6">  
</span>

## <span class="rvts0"><span class="rvts16">5) Property types</span></span>

<span class="rvts6">The following controls are possible for user-defined properties:</span>

<img src="lib/Plugin-possiblepropertytypes.png" width="50%" height="50%">

*   <span class="rvts6">simple text: one line of text</span>
*   <span class="rvts6">text area: popup for multi-line text entry</span>
*   <span class="rvts6">dropdown selection from a deined list of options</span>
*   <span class="rvts6">numeric-only field</span>
*   <span class="rvts6">checkbox: for true/false entry</span>  
    <span class="rvts6">  
    </span>

<span class="rvts6">  
</span>

## <span class="rvts0"><span class="rvts16">6) Property definition</span></span>

<span class="rvts6">Examples are provided in the comments section of each config file.  Here's an overview of the schema:</span>

<img src="lib/Plugin-propertyschema.png" width="50%" height="50%">

<span class="rvts6">Here's another view, consolidated:</span>

<img src="lib/Plugin-custompropsconsolidatedschema.png" width="50%" height="50%">

<span class="rvts6">- propertyName: mandatory, this is the property label that will appear in the Property Pane</span>

<span class="rvts6">- propertyKeyword: mandatory, this is the unique key for the property</span>

<span class="rvts6">- shouldValidate: optional, boolean true/false to define whether to validate the regular expression of the text input [default: false]</span>

<span class="rvts6">- propertyTooltip: optional, in the case of input types textarea and select, it is possible to display a tooltip  defined here</span>

<span class="rvts6">- propertyType: mandatory, this is the control definition, with possible values: text, details, select (i.e. dropdown), checkbox</span>

<span class="rvts6">- options: optional, this is the array of possible checkbox options</span>

<span class="rvts6">- template: optional, this is needed in the case of propertyType = details, to define a popup multi-line text.  Possible value: textarea</span>

<span class="rvts6">- valueType: optional, this is needed in to specify that a property is numberic only.  Possible values: numeric</span>

<span class="rvts6">  
</span>

## <span class="rvts0"><span class="rvts16">7) Share customization with team members</span></span>

<span class="rvts6">After making, saving and testing your changes, you should share them with everyone on your team to insure consistency. This is a 3-step process:</span>

<span class="rvts6">- return to the plugin directory via Help > Show plugin directory, and zip up the whole plugin directory where you made your changes;</span>

<span class="rvts6">- transfer this zip file to each team member using Hackolade;</span>

<span class="rvts6">- on each team member's computer, start Hackolade, go to Help > DB target plugin manager, then click the button 'Install from zip file', and choose the zip file file.</span>

<span class="rvts6">  
</span>

<span class="rvts6">For the changes to take effect on each computer, it is required to exit Hackolade and restart it.</span>

<span class="rvts6">  
</span>



</div>

</div>

</article>

</div>
