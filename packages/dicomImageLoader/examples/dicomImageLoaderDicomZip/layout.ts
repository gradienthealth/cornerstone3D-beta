const html = `
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">

<div class="container mt-4">
   <select id="imageSelector">
    <option value="" selected>Select an image</option>
    <optgroup label="Dicom zip">
        <option>CT_zip.zip:zip//CTImage.dcm</option>
        <option>CT_zip.zip:zip//CTImage.dcm_BigEndianExplicitTransferSyntax_1.2.840.10008.1.2.2.dcm</option>
        <option>CT_zip.zip:zip//CTImage.dcm_DeflatedExplicitVRLittleEndianTransferSyntax_1.2.840.10008.1.2.1.99.dcm</option>
        <option>CT_zip.zip:zip//CTImage.dcm_JPEG2000LosslessOnlyTransferSyntax_1.2.840.10008.1.2.4.90.dcm</option>
        <option>CT_zip.zip:zip//CTImage.dcm_JPEG2000TransferSyntax_1.2.840.10008.1.2.4.91.dcm</option>
    </optgroup>
    </select>

    <br>
    <br>
    <div class="row">
        <div class="col-md-6">
            <div style="width:512px;height:512px;position:relative;color: white;display:inline-block;border-style:solid;border-color:black;"
                 oncontextmenu="return false"
                 class='disable-selection noIbar'
                 unselectable='on'
                 onselectstart='return false;'
                 onmousedown='return false;'>
                <div id="cornerstone-element"
                     style="width:512px;height:512px;top:0px;left:0px; position:absolute">
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <span>Transfer Syntax: </span><span id="transferSyntax"></span><br>
            <span>SOP Class: </span><span id="sopClass"></span><br>
            <span>Samples Per Pixel: </span><span id="samplesPerPixel"></span><br>
            <span>Photometric Interpretation: </span><span id="photometricInterpretation"></span><br>
            <span>Number Of Frames: </span><span id="numberOfFrames"></span><br>
            <span>Planar Configuration: </span><span id="planarConfiguration"></span><br>
            <span>Rows: </span><span id="rows"></span><br>
            <span>Columns: </span><span id="columns"></span><br>
            <span>Pixel Spacing: </span><span id="pixelSpacing"></span><br>
            <span>Row Pixel Spacing: </span><span id="rowPixelSpacing"></span><br>
            <span>Column Pixel Spacing: </span><span id="columnPixelSpacing"></span><br>
            <span>Bits Allocated: </span><span id="bitsAllocated"></span><br>
            <span>Bits Stored: </span><span id="bitsStored"></span><br>
            <span>High Bit: </span><span id="highBit"></span><br>
            <span>Pixel Representation: </span><span id="pixelRepresentation"></span><br>
            <span>WindowCenter: </span><span id="windowCenter"></span><br>
            <span>WindowWidth: </span><span id="windowWidth"></span><br>
            <span>RescaleIntercept: </span><span id="rescaleIntercept"></span><br>
            <span>RescaleSlope: </span><span id="rescaleSlope"></span><br>
            <span>Basic Offset Table Entries: </span><span id="basicOffsetTable"></span><br>
            <span>Fragments: </span><span id="fragments"></span><br>
            <span>Max Stored Pixel Value: </span><span id="maxStoredPixelValue"></span><br>
            <span>Min Stored Pixel Value: </span><span id="minStoredPixelValue"></span><br>
            <span>Total Time: </span><span id="totalTime"></span><br>
            <span>Load Time: </span><span id="loadTime"></span><br>
            <span>Decode Time: </span><span id="decodeTime"></span><br>
        </div>
    </div>
</div>
`;

export default html;
