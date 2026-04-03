import { useCallback } from 'react';
import { message } from 'antd';
import { updateShot, deleteShot } from '@/api/script';

/**
 * 分镜数据管理 Hook
 * 统一处理分镜数据的更新和局部刷新
 */
export function useScriptData(script: any, setScript: (updater: (prev: any) => any) => void) {
  /**
   * 更新分镜数据（局部刷新）
   */
  const updateShotData = useCallback(
    async (
      shotId: number,
      data: any,
      options?: {
        showMessage?: boolean;
        successMessage?: string;
      }
    ) => {
      const { showMessage = true, successMessage = '保存成功' } = options ?? {};

      try {
        const res = await updateShot(shotId, data);

        if (res.success && res.data) {
          if (showMessage) {
            message.success(successMessage);
          }

          // 局部更新：只更新对应的 shot 数据
          setScript((prevScript: any) => {
            if (!prevScript) return prevScript;

            const updatedShots = prevScript.shots.map((shot: any) =>
              shot.id === shotId ? res.data : shot
            );

            return { ...prevScript, shots: updatedShots };
          });

          return res.data;
        } else {
          throw new Error(res.message || '保存失败');
        }
      } catch (error: any) {
        if (showMessage) {
          message.error(error.message || '保存失败');
        }
        throw error;
      }
    },
    [setScript]
  );

  /**
   * 删除分镜数据（局部刷新）
   */
  const deleteShotData = useCallback(
    async (shotId: number) => {
      try {
        const res = await deleteShot(shotId);

        if (res.success) {
          message.success('删除成功');

          // 局部更新：从 shots 数组中移除对应的 shot
          setScript((prevScript: any) => {
            if (!prevScript) return prevScript;

            const updatedShots = prevScript.shots.filter((shot: any) => shot.id !== shotId);

            return { ...prevScript, shots: updatedShots };
          });
        } else {
          throw new Error(res.message || '删除失败');
        }
      } catch (error: any) {
        message.error(error.message || '删除失败');
        throw error;
      }
    },
    [setScript]
  );

  /**
   * 更新分镜中的图片数据（局部刷新）
   */
  const updateShotImage = useCallback(
    (shotId: number, image: any) => {
      setScript((prevScript: any) => {
        if (!prevScript) return prevScript;

        const updatedShots = prevScript.shots.map((shot: any) => {
          if (shot.id === shotId) {
            return {
              ...shot,
              images: shot.images ? [...shot.images, image] : [image],
            };
          }
          return shot;
        });

        return { ...prevScript, shots: updatedShots };
      });
    },
    [setScript]
  );

  /**
   * 更新分镜中的视频数据（局部刷新）
   */
  const updateShotVideo = useCallback(
    (shotId: number, video: any) => {
      setScript((prevScript: any) => {
        if (!prevScript) return prevScript;

        const updatedShots = prevScript.shots.map((shot: any) => {
          if (shot.id === shotId) {
            // 确保视频对象包含必要的字段
            const completeVideo = {
              ...video,
              status: 'completed',
              createdAt: new Date().toISOString(),
            };

            const newVideos = shot.videos ? [...shot.videos, completeVideo] : [completeVideo];
            return {
              ...shot,
              videos: newVideos,
            };
          }
          return shot;
        });

        return { ...prevScript, shots: updatedShots };
      });
    },
    [setScript]
  );

  /**
   * 更新分镜中特定视频的状态（局部刷新）
   */
  const updateVideoStatus = useCallback(
    (shotId: number, videoId: number, updates: any) => {
      setScript((prevScript: any) => {
        if (!prevScript) return prevScript;

        const updatedShots = prevScript.shots.map((shot: any) => {
          if (shot.id === shotId && shot.videos) {
            const updatedVideos = shot.videos.map((video: any) =>
              video.id === videoId ? { ...video, ...updates } : video
            );
            return { ...shot, videos: updatedVideos };
          }
          return shot;
        });

        return { ...prevScript, shots: updatedShots };
      });
    },
    [setScript]
  );

  /**
   * 删除分镜中的图片（局部刷新）
   */
  const removeShotImage = useCallback(
    (imageId: number) => {
      setScript((prevScript: any) => {
        if (!prevScript) return prevScript;

        const updatedShots = prevScript.shots.map((shot: any) => {
          const hasDeletedImage = shot.images?.some((img: any) => img.id === imageId);
          if (hasDeletedImage) {
            return {
              ...shot,
              images: shot.images.filter((img: any) => img.id !== imageId),
            };
          }
          return shot;
        });

        return { ...prevScript, shots: updatedShots };
      });
    },
    [setScript]
  );

  /**
   * 更新图片的首帧/尾帧标记（局部刷新）
   */
  const updateImageFrameStatus = useCallback(
    (shotId: number, imageId: number, frameType: 'first' | 'last') => {
      setScript((prevScript: any) => {
        if (!prevScript) return prevScript;

        const updatedShots = prevScript.shots.map((shot: any) => {
          if (shot.id === shotId) {
            const updatedImages = (shot.images || []).map((img: any) => ({
              ...img,
              ...(frameType === 'first'
                ? { isFirstFrame: img.id === imageId }
                : { isLastFrame: img.id === imageId }),
            }));
            return { ...shot, images: updatedImages };
          }
          return shot;
        });

        return { ...prevScript, shots: updatedShots };
      });
    },
    [setScript]
  );

  return {
    updateShotData,
    deleteShotData,
    updateShotImage,
    updateShotVideo,
    updateVideoStatus,
    removeShotImage,
    updateImageFrameStatus,
  };
}
