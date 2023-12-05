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

    const SingleImageSOPClassUIDMap = {
        "1.2.840.10008.5.1.4.1.1.7": MGImageNormalizer,
        "1.2.840.10008.5.1.4.1.1.12.1": XAImageNormalizer
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
