package com.hackathon.service.upload;

import com.hackathon.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 文件上传服务
 * - 本地文件存储到 upload-dir 目录
 * - 按日期分目录：uploads/2026-07-07/xxx.pdf
 * - 返回可访问的 URL 路径
 */
@Slf4j
@Service
public class FileUploadService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${file.max-size:52428800}") // 50MB
    private long maxFileSize;

    /** 允许的文件扩展名 */
    private static final String[] ALLOWED_EXTENSIONS = {
            "pdf", "doc", "docx", "ppt", "pptx",
            "zip", "rar", "7z", "tar", "gz",
            "jpg", "jpeg", "png", "gif", "svg",
            "mp4", "avi", "mov",
            "py", "java", "cpp", "c", "js", "html", "css",
            "txt", "md", "json", "csv", "xlsx", "xls"
    };

    /**
     * 上传文件
     * @param file MultipartFile
     * @return 文件访问 URL
     */
    public String uploadFile(MultipartFile file) {
        // 校验文件不为空
        if (file == null || file.isEmpty()) {
            throw new BusinessException("上传文件不能为空");
        }

        // 校验文件大小
        if (file.getSize() > maxFileSize) {
            throw new BusinessException("文件大小超过限制，最大允许 " + (maxFileSize / 1024 / 1024) + "MB");
        }

        // 校验文件扩展名
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !isAllowedExtension(originalFilename)) {
            throw new BusinessException("不允许的文件类型，支持：" + String.join(", ", ALLOWED_EXTENSIONS));
        }

        try {
            // 按日期建子目录
            String dateDir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            Path targetDir = Paths.get(uploadDir, dateDir);

            // 创建目录（如果不存在）
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            // 生成唯一文件名（UUID + 原扩展名）
            String extension = getExtension(originalFilename);
            String uniqueName = UUID.randomUUID().toString().replace("-", "") + "." + extension;
            Path targetFile = targetDir.resolve(uniqueName);

            // 写入文件
            file.transferTo(targetFile.toFile());

            // 返回 URL 路径（相对路径，前端拼接 baseURL）
            String fileUrl = "/" + uploadDir + "/" + dateDir + "/" + uniqueName;
            log.info("文件上传成功: {} -> {}, size={}", originalFilename, fileUrl, file.getSize());

            return fileUrl;
        } catch (IOException e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new BusinessException("文件上传失败：" + e.getMessage());
        }
    }

    /**
     * 删除已上传的文件
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;

        try {
            // 从 URL 解析实际文件路径
            Path filePath = Paths.get(fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("文件删除成功: {}", fileUrl);
            }
        } catch (IOException e) {
            log.warn("文件删除失败: {}", e.getMessage());
        }
    }

    private boolean isAllowedExtension(String filename) {
        String ext = getExtension(filename).toLowerCase();
        for (String allowed : ALLOWED_EXTENSIONS) {
            if (allowed.equals(ext)) return true;
        }
        return false;
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex > 0 ? filename.substring(dotIndex + 1) : "";
    }
}
