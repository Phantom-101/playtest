import * as THREE from 'three';

export default class RigidBody {
    constructor(physicsWorld) {
        this.physicsWorld = physicsWorld;
    }

    setBounciness(bounciness) {
        this.body.bounciness = bounciness;
    }

    setFriction(friction) {
        this.body.friction = friction;
    }

    createBox(mass, pos, quat, size) {
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        this.transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        this.motionState = new Ammo.btDefaultMotionState(this.transform);

        const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
        this.shape = new Ammo.btBoxShape(btSize);
        this.shape.setMargin(0.05);

        this.inertia = new Ammo.btVector3(0, 0, 0);
        if (mass > 0) {
            this.shape.calculateLocalInertia(mass, this.inertia);
        }

        this.info = new Ammo.btRigidBodyConstructionInfo(mass, this.motionState, this.shape, this.inertia);
        this.body = new Ammo.btRigidBody(this.info);

        Ammo.destroy(btSize);

        this.physicsWorld.addRigidBody(this.body);
    }

    createCapsule(mass, pos, quat, size) {
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        this.transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        this.motionState = new Ammo.btDefaultMotionState(this.transform);

        this.shape = new Ammo.btCapsuleShape(size.radius, size.height);
        this.shape.setMargin(0.05);

        this.inertia = new Ammo.btVector3(0, 0, 0);
        if (mass > 0) {
            this.shape.calculateLocalInertia(mass, this.inertia);
        }

        this.info = new Ammo.btRigidBodyConstructionInfo(mass, this.motionState, this.shape, this.inertia);
        this.body = new Ammo.btRigidBody(this.info);

        this.physicsWorld.addRigidBody(this.body);
    }

    createMesh(pos, quat, mesh) {
        this.transform = new Ammo.btTransform();
        this.transform.setIdentity();
        this.transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        this.transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        this.motionState = new Ammo.btDefaultMotionState(this.transform);

        // Build Ammo triangle mesh from a single mesh
        const triangleMesh = new Ammo.btTriangleMesh();

        const geometry = mesh.geometry.isBufferGeometry ? mesh.geometry : new THREE.BufferGeometry().fromGeometry(mesh.geometry);
        const vertices = geometry.attributes.position.array;
        const index = geometry.index ? geometry.index.array : null;

        if (index) {
            for (let i = 0; i < index.length; i += 3) {
                const ai = index[i] * 3, bi = index[i + 1] * 3, ci = index[i + 2] * 3;
                const a = new Ammo.btVector3(vertices[ai], vertices[ai + 1], vertices[ai + 2]);
                const b = new Ammo.btVector3(vertices[bi], vertices[bi + 1], vertices[bi + 2]);
                const c = new Ammo.btVector3(vertices[ci], vertices[ci + 1], vertices[ci + 2]);
                triangleMesh.addTriangle(a, b, c, true);
                Ammo.destroy(a); Ammo.destroy(b); Ammo.destroy(c);
            }
        } else {
            for (let i = 0; i < vertices.length; i += 9) {
                const a = new Ammo.btVector3(vertices[i], vertices[i + 1], vertices[i + 2]);
                const b = new Ammo.btVector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
                const c = new Ammo.btVector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
                triangleMesh.addTriangle(a, b, c, true);
                Ammo.destroy(a); Ammo.destroy(b); Ammo.destroy(c);
            }
        }

        this.shape = new Ammo.btBvhTriangleMeshShape(triangleMesh, true, true);
        this.shape.setMargin(0.05);

        this.inertia = new Ammo.btVector3(0, 0, 0);

        this.info = new Ammo.btRigidBodyConstructionInfo(0, this.motionState, this.shape, this.inertia);
        this.body = new Ammo.btRigidBody(this.info);

        this.physicsWorld.addRigidBody(this.body);
    }

    changeGroupMask(body, group, mask) {
        this.physicsWorld.removeRigidBody(body);
        this.physicsWorld.addRigidBody(body, group, mask);
    }
}