package com.campushub.backend.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class TeachingId implements Serializable {

    private String profId;
    private String subjectId;

    public TeachingId() {
    }

    public TeachingId(String profId, String subjectId) {
        this.profId = profId;
        this.subjectId = subjectId;
    }

    public String getProfId() {
        return profId;
    }

    public void setProfId(String profId) {
        this.profId = profId;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TeachingId)) return false;
        TeachingId that = (TeachingId) o;
        return Objects.equals(profId, that.profId)
                && Objects.equals(subjectId, that.subjectId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(profId, subjectId);
    }
}