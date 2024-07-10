import { normalizers } from "dcmjs";

const { Normalizer, ImageNormalizer } = normalizers;

export default function overrideNormalize(metaData) {
    class XAImageNormalizer extends ImageNormalizer {
        normalize() {
            this.dataset = getHandledSingleImageDataset(
                this.datasets[0],
                metaData
            );
            super.normalizeMultiframe();
        }
    }

    class MGImageNormalizer extends ImageNormalizer {
        normalize() {
            this.dataset = getHandledSingleImageDataset(
                this.datasets[0],
                metaData
            );
            super.normalizeMultiframe();
        }
    }

    class SecondaryCapturedImageNormalizer extends ImageNormalizer {
        normalize() {
            let normalizerClass: { new () } = null;
            switch (this.dataSets[0].Modality) {
                case "MG":
                    normalizerClass = Normalizer.normalizerForSOPClassUID(
                        "1.2.840.10008.5.1.4.1.1.1.2"
                    );
                    break;
                case "XA":
                    normalizerClass = Normalizer.normalizerForSOPClassUID(
                        "1.2.840.10008.5.1.4.1.1.12.1"
                    );
                    break;
                default:
                    super.normalize();
                    return;
            }

            const normalizer = new normalizerClass(this.dataSets);
            normalizer.normalize();
        }
    }

    const SingleImageSOPClassUIDMap = {
        "1.2.840.10008.5.1.4.1.1.1.2": MGImageNormalizer,
        "1.2.840.10008.5.1.4.1.1.1.2.1": MGImageNormalizer,
        "1.2.840.10008.5.1.4.1.1.13.1.3": MGImageNormalizer,
        "1.2.840.10008.5.1.4.1.1.12.1": XAImageNormalizer,
        "1.2.840.10008.5.1.4.1.1.7": SecondaryCapturedImageNormalizer
    };

    const parentNormalizerForSOPClassUID = Normalizer.normalizerForSOPClassUID;
    Normalizer.normalizerForSOPClassUID = sopClassUID => {
        const normalizerClass = parentNormalizerForSOPClassUID(sopClassUID);

        if (normalizerClass) {
            return normalizerClass;
        } else {
            return SingleImageSOPClassUIDMap[sopClassUID];
        }
    };
}

function getHandledSingleImageDataset(dataset, metaData) {
    const { rowCosines, columnCosines } = metaData.get(
        "imagePlaneModule",
        dataset.imageId
    );
    return {
        ...dataset,
        ReferencedSeriesSequence: {
            SeriesInstanceUID: dataset.SeriesInstanceUID,
            ReferencedInstanceSequence: [
                {
                    ReferencedSOPClassUID: dataset.SOPClassUID,
                    ReferencedSOPInstanceUID: dataset.SOPInstanceUID
                }
            ]
        },
        SharedFunctionalGroupsSequence: {
            PlaneOrientationSequence: {
                ImageOrientationPatient: dataset.ImageOrientationPatient || [
                    ...rowCosines,
                    ...columnCosines
                ]
            },
            PixelMeasuresSequence: {
                PixelSpacing: dataset.PixelSpacing,
                SpacingBetweenSlices: 0,
                SliceThickness: 0
            },
            PixelValueTransformationSequence: {
                RescaleIntercept: dataset.RescaleIntercept,
                RescaleSlope: dataset.RescaleSlope,
                RescaleType: dataset.RescaleType
            }
        },
        PerFrameFunctionalGroupsSequence: {
            PlanePositionSequence: {
                ImagePositionPatient: dataset.ImagePositionPatient || [0, 0, 0]
            },
            FrameVOILUTSequence: {
                WindowCenter: dataset.WindowCenter,
                WindowWidth: dataset.WindowWidth
            },
            PlaneOrientationSequence: {
                ImageOrientationPatient: dataset.ImageOrientationPatient || [
                    ...rowCosines,
                    ...columnCosines
                ]
            }
        },
        NumberOfFrames: 1,
        ImageOrientationPatient: dataset.ImageOrientationPatient || [
            ...rowCosines,
            ...columnCosines
        ],
        ImagePositionPatient: dataset.ImagePositionPatient || [0, 0, 0]
    };
}
