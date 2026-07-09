package com.hackathon.dto;

import lombok.Data;

import java.util.List;

@Data
public class PageResponse<T> {

    private List<T> content;     // 旧字段名
    private List<T> list;        // 契约字段名（与 content 同值）
    private long totalElements;
    private long total;          // 契约字段名（= totalElements）
    private int totalPages;
    private int pageNumber;
    private int page;            // 契约字段名（= pageNumber + 1，从1开始）
    private int pageSize;
    private int size;            // 契约字段名（= pageSize）
    private boolean first;
    private boolean last;

    public static <T> PageResponse<T> of(org.springframework.data.domain.Page<T> page) {
        PageResponse<T> response = new PageResponse<>();
        response.setContent(page.getContent());
        response.setList(page.getContent());
        response.setTotalElements(page.getTotalElements());
        response.setTotal(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setPageNumber(page.getNumber());
        response.setPage(page.getNumber() + 1);  // 契约 page 从1开始
        response.setPageSize(page.getSize());
        response.setSize(page.getSize());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());
        return response;
    }
}
